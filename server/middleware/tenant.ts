/**
 * Multi-Tenant Middleware for Wingman.vip
 *
 * Provides tenant-scoped tRPC procedures that automatically inject
 * orgId into all DB queries, enforcing data isolation between organizations.
 *
 * Usage:
 *   - `tenantProcedure` — requires authenticated user with an orgId
 *   - `optionalTenantProcedure` — authenticated user, orgId optional
 *   - `tenantAdminProcedure` — requires admin role within the tenant
 */

import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { organizations } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Extended context with tenant info
 */
export type TenantContext = {
  orgId: number;
  orgSlug: string;
  orgPlan: string;
};

/**
 * tenantProcedure — requires authenticated user belonging to an organization.
 * Injects `ctx.tenant` with orgId, slug, and plan.
 */
export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must belong to an organization to access this resource.',
    });
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  }

  const org = await db.select({
    id: organizations.id,
    slug: organizations.slug,
    plan: organizations.plan,
    isActive: organizations.isActive,
  }).from(organizations).where(eq(organizations.id, ctx.user.orgId)).limit(1);

  if (!org.length || !org[0].isActive) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your organization is inactive or not found.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenant: {
        orgId: org[0].id,
        orgSlug: org[0].slug,
        orgPlan: org[0].plan,
      } satisfies TenantContext,
    },
  });
});

/**
 * optionalTenantProcedure — authenticated user, tenant info injected if orgId exists.
 * ctx.tenant will be null if user has no org.
 */
export const optionalTenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  let tenant: TenantContext | null = null;

  if (ctx.user.orgId) {
    const db = await getDb();
    if (db) {
      const org = await db.select({
        id: organizations.id,
        slug: organizations.slug,
        plan: organizations.plan,
        isActive: organizations.isActive,
      }).from(organizations).where(eq(organizations.id, ctx.user.orgId)).limit(1);

      if (org.length && org[0].isActive) {
        tenant = {
          orgId: org[0].id,
          orgSlug: org[0].slug,
          orgPlan: org[0].plan,
        };
      }
    }
  }

  return next({
    ctx: {
      ...ctx,
      tenant,
    },
  });
});

/**
 * tenantAdminProcedure — requires authenticated user with admin role in their org.
 */
export const tenantAdminProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && !ctx.user.isSuperAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin role required within your organization.',
    });
  }
  return next({ ctx });
});

/**
 * Helper: Build a tenant-scoped WHERE clause fragment.
 * Use in DB queries to ensure data isolation.
 *
 * Example:
 *   const filter = tenantFilter(ctx.tenant.orgId);
 *   await db.select().from(users).where(and(filter, eq(users.id, id)));
 */
export function tenantFilter(orgId: number) {
  // Import this in routers that need tenant-scoped queries
  const { eq } = require('drizzle-orm');
  const { users } = require('../../drizzle/schema');
  return eq(users.orgId, orgId);
}

/**
 * Tenant plan feature gates
 */
export const PLAN_LIMITS = {
  free: {
    maxUsers: 5,
    maxWingmen: 1,
    dailyIntroductions: 10,
    features: ['soul_forge', 'basic_discovery', 'public_spaces'],
  },
  starter: {
    maxUsers: 25,
    maxWingmen: 5,
    dailyIntroductions: 50,
    features: ['soul_forge', 'discovery', 'spaces', 'travel_intel'],
  },
  professional: {
    maxUsers: 100,
    maxWingmen: 20,
    dailyIntroductions: 200,
    features: ['soul_forge', 'discovery', 'spaces', 'travel_intel', 'wingman_tv', 'dream_board', 'conferences'],
  },
  enterprise: {
    maxUsers: -1, // unlimited
    maxWingmen: -1,
    dailyIntroductions: -1,
    features: ['all'],
  },
} as const;

export type OrgPlan = keyof typeof PLAN_LIMITS;

/**
 * Check if a plan includes a specific feature
 */
export function planHasFeature(plan: string, feature: string): boolean {
  const limits = PLAN_LIMITS[plan as OrgPlan];
  if (!limits) return false;
  if ('features' in limits && limits.features.includes('all' as never)) return true;
  return 'features' in limits && (limits.features as readonly string[]).includes(feature);
}
