import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import {
  users, organizations, emailVerifications, oauthAccounts,
  passwordResets, orgInvitations, adminLogs
} from '../../drizzle/schema';
import { eq, and, gt, isNull, desc, like, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { sdk } from '../_core/sdk';
import { ONE_YEAR_MS } from '../../shared/const';
import { invokeLLM } from '../_core/llm';
import { sendVerificationEmail, sendPasswordResetEmail } from '../email';

// ─── Email/Password Auth ───────────────────────────────────────────────────────
const emailAuthRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      orgSlug: z.string().optional(),
      origin: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      // Check if email already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = `email_${nanoid(24)}`;

      // Find org if slug provided
      let orgId: number | undefined;
      if (input.orgSlug) {
        const org = await db.select().from(organizations).where(eq(organizations.slug, input.orgSlug)).limit(1);
        if (org.length > 0) orgId = org[0].id;
      }

      await db.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        passwordHash,
        authProvider: 'email',
        emailVerified: false,
        orgId: orgId ?? null,
        lastSignedIn: new Date(),
      });

      const newUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      const userId = newUser[0].id;

      // Create email verification token
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(emailVerifications).values({ userId, token, expiresAt });

      // Send verification email (falls back to console log in dev when RESEND_API_KEY not set)
      const verificationUrl = `${input.origin ?? 'http://localhost:3000'}/auth?flow=verify&token=${token}`;
      await sendVerificationEmail({
        to: input.email,
        name: input.name,
        verificationUrl,
        expiresInHours: 24,
      });
      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        verificationToken: process.env.NODE_ENV === 'development' ? token : undefined,
        openId,
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (result.length === 0) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      const user = result[0];
      if (!user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'This account uses social login. Please sign in with Google or Microsoft.' });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      if (!user.emailVerified) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Please verify your email before signing in.' });
      }

      if (user.suspendedAt) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Account suspended: ${user.suspendReason || 'Contact support'}` });
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || '', expiresInMs: ONE_YEAR_MS });

      return {
        success: true,
        sessionToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        },
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const result = await db.select().from(emailVerifications)
        .where(and(
          eq(emailVerifications.token, input.token),
          gt(emailVerifications.expiresAt, new Date()),
          isNull(emailVerifications.usedAt),
        ))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired verification token' });
      }

      const verification = result[0];
      await db.update(emailVerifications).set({ usedAt: new Date() }).where(eq(emailVerifications.id, verification.id));
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, verification.userId));

      return { success: true, message: 'Email verified successfully. You can now sign in.' };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      // Always return success to prevent email enumeration
      if (result.length === 0) return { success: true, message: 'If that email exists, a reset link has been sent.' };

      const user = result[0];
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.insert(passwordResets).values({ userId: user.id, token, expiresAt });

      // Send password reset email
      const resetUrl = `${input.origin ?? 'http://localhost:3000'}/auth?flow=reset&token=${token}`;
      await sendPasswordResetEmail({
        to: user.email ?? input.email,
        name: user.name ?? 'there',
        resetUrl,
        expiresInHours: 1,
      });

      return {
        success: true,
        message: 'If that email exists, a reset link has been sent.',
        resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
      };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const result = await db.select().from(passwordResets)
        .where(and(
          eq(passwordResets.token, input.token),
          gt(passwordResets.expiresAt, new Date()),
          isNull(passwordResets.usedAt),
        ))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired reset token' });
      }

      const reset = result[0];
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, reset.userId));
      await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));

      return { success: true, message: 'Password reset successfully. You can now sign in.' };
    }),
});

// ─── Organization (Tenant) Management ─────────────────────────────────────────
const orgRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2),
      slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
      plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const existing = await db.select().from(organizations).where(eq(organizations.slug, input.slug)).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: 'CONFLICT', message: 'Organization slug already taken' });

      await db.insert(organizations).values({
        name: input.name,
        slug: input.slug,
        plan: input.plan || 'free',
        ownerId: ctx.user.id,
        isActive: true,
      });

      const org = await db.select().from(organizations).where(eq(organizations.slug, input.slug)).limit(1);
      // Link user to org
      await db.update(users).set({ orgId: org[0].id }).where(eq(users.id, ctx.user.id));

      return { success: true, org: org[0] };
    }),

  getMyOrg: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    if (!ctx.user.orgId) return null;
    const result = await db.select().from(organizations).where(eq(organizations.id, ctx.user.orgId)).limit(1);
    return result[0] ?? null;
  }),

  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    if (!ctx.user.orgId) return [];
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      authProvider: users.authProvider,
      emailVerified: users.emailVerified,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users).where(eq(users.orgId, ctx.user.orgId));
    return result;
  }),

  inviteMember: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['user', 'admin']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      if (!ctx.user.orgId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'You are not part of an organization' });

      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(orgInvitations).values({
        orgId: ctx.user.orgId,
        email: input.email,
        role: input.role || 'user',
        token,
        invitedBy: ctx.user.id,
        expiresAt,
      });

      return {
        success: true,
        inviteToken: process.env.NODE_ENV === 'development' ? token : undefined,
        message: 'Invitation sent.',
      };
    }),

  acceptInvite: publicProcedure
    .input(z.object({ token: z.string(), userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const result = await db.select().from(orgInvitations)
        .where(and(
          eq(orgInvitations.token, input.token),
          gt(orgInvitations.expiresAt, new Date()),
          isNull(orgInvitations.acceptedAt),
        ))
        .limit(1);

      if (result.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired invitation' });

      const invite = result[0];
      await db.update(users).set({ orgId: invite.orgId, role: invite.role }).where(eq(users.id, input.userId));
      await db.update(orgInvitations).set({ acceptedAt: new Date() }).where(eq(orgInvitations.id, invite.id));

      return { success: true };
    }),
});

// ─── Super-Admin Router ────────────────────────────────────────────────────────
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isSuperAdmin && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Super admin access required' });
  }
  return next({ ctx });
});

const superAdminRouter = router({
  // List all tenants
  listOrgs: superAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { orgs: [], total: 0 };

      const orgs = await db.select().from(organizations)
        .orderBy(desc(organizations.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      return { orgs, total: orgs.length };
    }),

  // Create a tenant
  createOrg: superAdminProcedure
    .input(z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
      maxUsers: z.number().default(10),
      ownerEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      await db.insert(organizations).values({
        name: input.name,
        slug: input.slug,
        plan: input.plan,
        maxUsers: input.maxUsers,
        isActive: true,
      });

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: 'create_org',
        targetType: 'organization',
        details: { slug: input.slug, plan: input.plan },
      });

      return { success: true };
    }),

  // Update org plan/status
  updateOrg: superAdminProcedure
    .input(z.object({
      orgId: z.number(),
      plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
      isActive: z.boolean().optional(),
      maxUsers: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const update: Record<string, unknown> = {};
      if (input.plan !== undefined) update.plan = input.plan;
      if (input.isActive !== undefined) update.isActive = input.isActive;
      if (input.maxUsers !== undefined) update.maxUsers = input.maxUsers;

      await db.update(organizations).set(update).where(eq(organizations.id, input.orgId));
      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: 'update_org',
        targetType: 'organization',
        targetId: input.orgId,
        details: update,
      });

      return { success: true };
    }),

  // List all users (global)
  listUsers: superAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      orgId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { users: [], total: 0 };

      const result = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        authProvider: users.authProvider,
        emailVerified: users.emailVerified,
        subscriptionTier: users.subscriptionTier,
        isSuperAdmin: users.isSuperAdmin,
        suspendedAt: users.suspendedAt,
        orgId: users.orgId,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      return { users: result, total: result.length };
    }),

  // Update user role/subscription
  updateUser: superAdminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['user', 'admin']).optional(),
      subscriptionTier: z.enum(['free', 'premium', 'enterprise']).optional(),
      isSuperAdmin: z.boolean().optional(),
      orgId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      const update: Record<string, unknown> = {};
      if (input.role !== undefined) update.role = input.role;
      if (input.subscriptionTier !== undefined) update.subscriptionTier = input.subscriptionTier;
      if (input.isSuperAdmin !== undefined) update.isSuperAdmin = input.isSuperAdmin;
      if (input.orgId !== undefined) update.orgId = input.orgId;

      await db.update(users).set(update).where(eq(users.id, input.userId));
      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: 'update_user',
        targetType: 'user',
        targetId: input.userId,
        details: update,
      });

      return { success: true };
    }),

  // Suspend/unsuspend user
  suspendUser: superAdminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional(),
      suspend: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });

      await db.update(users).set({
        suspendedAt: input.suspend ? new Date() : null,
        suspendReason: input.suspend ? (input.reason || 'Policy violation') : null,
      }).where(eq(users.id, input.userId));

      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: input.suspend ? 'suspend_user' : 'unsuspend_user',
        targetType: 'user',
        targetId: input.userId,
        details: { reason: input.reason },
      });

      return { success: true };
    }),

  // Get audit logs
  getAuditLogs: superAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };

      const logs = await db.select().from(adminLogs)
        .orderBy(desc(adminLogs.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      return { logs, total: logs.length };
    }),

  // Delete organization (soft delete via isActive=false)
  deleteOrg: superAdminProcedure
    .input(z.object({
      orgId: z.number(),
      confirm: z.literal(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await db.update(organizations)
        .set({ isActive: false })
        .where(eq(organizations.id, input.orgId));
      await db.insert(adminLogs).values({
        adminId: ctx.user.id,
        action: 'delete_org',
        targetType: 'organization',
        targetId: input.orgId,
        details: { deletedAt: new Date().toISOString() },
      });
      return { success: true };
    }),

  // Platform-wide analytics
  getPlatformAnalytics: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const [totalUsers, totalOrgs] = await Promise.all([
      db.select().from(users),
      db.select().from(organizations),
    ]);

    const authBreakdown = totalUsers.reduce((acc, u) => {
      acc[u.authProvider] = (acc[u.authProvider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const planBreakdown = totalOrgs.reduce((acc, o) => {
      acc[o.plan] = (acc[o.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tierBreakdown = totalUsers.reduce((acc, u) => {
      acc[u.subscriptionTier] = (acc[u.subscriptionTier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: totalUsers.length,
      totalOrgs: totalOrgs.length,
      verifiedUsers: totalUsers.filter(u => u.emailVerified).length,
      suspendedUsers: totalUsers.filter(u => u.suspendedAt).length,
      authBreakdown,
      planBreakdown,
      tierBreakdown,
    };
  }),
});

export const authFullRouter = router({
  email: emailAuthRouter,
  org: orgRouter,
  superAdmin: superAdminRouter,
});
