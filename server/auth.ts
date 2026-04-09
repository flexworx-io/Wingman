/**
 * Wingman.vip — Full Authentication Module
 * Supports: Email/Password, Google OAuth, Microsoft OAuth (MSAL)
 * Multi-tenant aware: attaches orgId to session context
 */
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as msal from '@azure/msal-node';
import { getDb } from './db';
import { users, emailVerifications, oauthAccounts, passwordResets, organizations } from '../drizzle/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { ENV } from './_core/env';
import type { Express, Request, Response } from 'express';
import { sdk } from './_core/sdk';
import { getSessionCookieOptions } from './_core/cookies';
import { COOKIE_NAME, ONE_YEAR_MS } from '../shared/const';

// ─── Google OAuth Client ───────────────────────────────────────────────────────
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_BASE_URL}/api/auth/google/callback`
);

// ─── Microsoft MSAL Client ─────────────────────────────────────────────────────
const msalConfig: msal.Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || 'placeholder',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'placeholder',
  },
};
const msalClient = new msal.ConfidentialClientApplication(msalConfig);

// ─── Email Verification Helper ─────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
  console.log(`[Auth] Verification email for ${email}: ${verifyUrl}`);
  // In production, use nodemailer with SMTP_HOST, SMTP_USER, SMTP_PASS env vars
  // For now, log the URL (replace with real SMTP in production)
  if (process.env.SMTP_HOST) {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Wingman.vip" <${process.env.SMTP_FROM || 'noreply@wingman.vip'}>`,
      to: email,
      subject: 'Verify your Wingman.vip account',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;padding:40px;border-radius:16px;">
          <h1 style="color:#a855f7;margin-bottom:8px;">Welcome to Wingman.vip</h1>
          <p style="color:#94a3b8;">Hi ${name}, your AI social intermediary awaits.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            Verify Email & Forge Your Wingman
          </a>
          <p style="color:#64748b;font-size:12px;">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        </div>
      `,
    });
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  console.log(`[Auth] Password reset for ${email}: ${resetUrl}`);
  if (process.env.SMTP_HOST) {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Wingman.vip" <${process.env.SMTP_FROM || 'noreply@wingman.vip'}>`,
      to: email,
      subject: 'Reset your Wingman.vip password',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#fff;padding:40px;border-radius:16px;">
          <h1 style="color:#a855f7;">Password Reset</h1>
          <p style="color:#94a3b8;">Click below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            Reset Password
          </a>
          <p style="color:#64748b;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }
}

// ─── Email/Password Auth ───────────────────────────────────────────────────────
export async function registerWithEmail(params: {
  email: string;
  password: string;
  name: string;
  orgSlug?: string;
}): Promise<{ userId: number; verificationToken: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, params.email)).limit(1);
  if (existing.length > 0) throw new Error('Email already registered');

  const passwordHash = await bcrypt.hash(params.password, 12);
  const openId = `email_${nanoid(24)}`;

  // Find org if slug provided
  let orgId: number | null = null;
  if (params.orgSlug) {
    const org = await db.select().from(organizations).where(eq(organizations.slug, params.orgSlug)).limit(1);
    if (org.length > 0) orgId = org[0].id;
  }

  await db.insert(users).values({
    openId,
    name: params.name,
    email: params.email,
    loginMethod: 'email',
    authProvider: 'email',
    passwordHash,
    emailVerified: false,
    orgId,
    lastSignedIn: new Date(),
  });

  const inserted = await db.select().from(users).where(eq(users.email, params.email)).limit(1);
  const userId = inserted[0].id;

  // Create verification token
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await db.insert(emailVerifications).values({ userId, token, expiresAt });

  await sendVerificationEmail(params.email, token, params.name);

  return { userId, verificationToken: token };
}

export async function loginWithEmail(email: string, password: string): Promise<{ userId: number; openId: string } | null> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) return null;

  const user = result[0];
  if (!user.passwordHash) return null; // OAuth-only user
  if (user.suspendedAt) throw new Error('Account suspended');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  // Update last signed in
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  return { userId: user.id, openId: user.openId };
}

export async function verifyEmailToken(token: string): Promise<{ userId: number } | null> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const result = await db.select().from(emailVerifications)
    .where(and(
      eq(emailVerifications.token, token),
      gt(emailVerifications.expiresAt, new Date()),
      isNull(emailVerifications.usedAt)
    ))
    .limit(1);

  if (result.length === 0) return null;

  const verification = result[0];
  await db.update(emailVerifications).set({ usedAt: new Date() }).where(eq(emailVerifications.id, verification.id));
  await db.update(users).set({ emailVerified: true }).where(eq(users.id, verification.userId));

  return { userId: verification.userId };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) return; // Don't reveal if email exists

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await db.insert(passwordResets).values({ userId: result[0].id, token, expiresAt });
  await sendPasswordResetEmail(email, token);
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const result = await db.select().from(passwordResets)
    .where(and(
      eq(passwordResets.token, token),
      gt(passwordResets.expiresAt, new Date()),
      isNull(passwordResets.usedAt)
    ))
    .limit(1);

  if (result.length === 0) return false;

  const reset = result[0];
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, reset.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));

  return true;
}

// ─── Google OAuth ──────────────────────────────────────────────────────────────
export function getGoogleAuthUrl(state: string): string {
  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
}

export async function handleGoogleCallback(code: string): Promise<{ userId: number; openId: string; isNew: boolean }> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload()!;

  const providerAccountId = payload.sub;
  const email = payload.email!;
  const name = payload.name || email.split('@')[0];

  // Check if oauth account exists
  const existing = await db.select().from(oauthAccounts)
    .where(and(eq(oauthAccounts.provider, 'google'), eq(oauthAccounts.providerAccountId, providerAccountId)))
    .limit(1);

  if (existing.length > 0) {
    const user = await db.select().from(users).where(eq(users.id, existing[0].userId)).limit(1);
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user[0].id));
    return { userId: user[0].id, openId: user[0].openId, isNew: false };
  }

  // Check if user exists by email
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: number;
  let openId: string;
  let isNew = false;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    openId = existingUser[0].openId;
    await db.update(users).set({ emailVerified: true, lastSignedIn: new Date() }).where(eq(users.id, userId));
  } else {
    openId = `google_${nanoid(24)}`;
    await db.insert(users).values({
      openId,
      name,
      email,
      loginMethod: 'google',
      authProvider: 'google',
      emailVerified: true,
      lastSignedIn: new Date(),
    });
    const inserted = await db.select().from(users).where(eq(users.email, email)).limit(1);
    userId = inserted[0].id;
    isNew = true;
  }

  // Save OAuth account link
  await db.insert(oauthAccounts).values({
    userId,
    provider: 'google',
    providerAccountId,
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  }).onDuplicateKeyUpdate({ set: { accessToken: tokens.access_token || null } });

  return { userId, openId, isNew };
}

// ─── Microsoft OAuth ───────────────────────────────────────────────────────────
export function getMicrosoftAuthUrl(state: string): string {
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${process.env.APP_BASE_URL}/api/auth/microsoft/callback`;
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid email profile User.Read',
    state,
    response_mode: 'query',
  });
  const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
}

export async function handleMicrosoftCallback(code: string, redirectUri: string): Promise<{ userId: number; openId: string; isNew: boolean }> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const tokenRequest: msal.AuthorizationCodeRequest = {
    code,
    scopes: ['openid', 'email', 'profile', 'User.Read'],
    redirectUri,
  };

  const response = await msalClient.acquireTokenByCode(tokenRequest);
  const account = response.account!;
  const providerAccountId = account.localAccountId;
  const email = account.username;
  const name = account.name || email.split('@')[0];

  // Check if oauth account exists
  const existing = await db.select().from(oauthAccounts)
    .where(and(eq(oauthAccounts.provider, 'microsoft'), eq(oauthAccounts.providerAccountId, providerAccountId)))
    .limit(1);

  if (existing.length > 0) {
    const user = await db.select().from(users).where(eq(users.id, existing[0].userId)).limit(1);
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user[0].id));
    return { userId: user[0].id, openId: user[0].openId, isNew: false };
  }

  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: number;
  let openId: string;
  let isNew = false;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    openId = existingUser[0].openId;
    await db.update(users).set({ emailVerified: true, lastSignedIn: new Date() }).where(eq(users.id, userId));
  } else {
    openId = `microsoft_${nanoid(24)}`;
    await db.insert(users).values({
      openId,
      name,
      email,
      loginMethod: 'microsoft',
      authProvider: 'microsoft',
      emailVerified: true,
      lastSignedIn: new Date(),
    });
    const inserted = await db.select().from(users).where(eq(users.email, email)).limit(1);
    userId = inserted[0].id;
    isNew = true;
  }

  await db.insert(oauthAccounts).values({
    userId,
    provider: 'microsoft',
    providerAccountId,
    accessToken: response.accessToken || null,
    refreshToken: null,
    expiresAt: response.expiresOn || null,
  }).onDuplicateKeyUpdate({ set: { accessToken: response.accessToken || null } });

  return { userId, openId, isNew };
}

// ─── Register Auth Routes ──────────────────────────────────────────────────────
export function registerFullAuthRoutes(app: Express): void {
  // Google OAuth initiation
  app.get('/api/auth/google', (req: Request, res: Response) => {
    const state = (req.query.state as string) || btoa(JSON.stringify({ redirect: '/' }));
    res.redirect(getGoogleAuthUrl(state));
  });

  // Google OAuth callback
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) { res.redirect('/auth?error=no_code'); return; }

      const { openId, isNew } = await handleGoogleCallback(code);
      const token = await createSessionToken(openId);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(isNew ? '/onboarding' : '/dashboard');
    } catch (err) {
      console.error('[Auth] Google callback error:', err);
      res.redirect('/auth?error=google_failed');
    }
  });

  // Microsoft OAuth initiation
  app.get('/api/auth/microsoft', (req: Request, res: Response) => {
    const state = (req.query.state as string) || btoa(JSON.stringify({ redirect: '/' }));
    res.redirect(getMicrosoftAuthUrl(state));
  });

  // Microsoft OAuth callback
  app.get('/api/auth/microsoft/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) { res.redirect('/auth?error=no_code'); return; }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/microsoft/callback`;
      const { openId, isNew } = await handleMicrosoftCallback(code, redirectUri);
      const token = await createSessionToken(openId);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(isNew ? '/onboarding' : '/dashboard');
    } catch (err) {
      console.error('[Auth] Microsoft callback error:', err);
      res.redirect('/auth?error=microsoft_failed');
    }
  });

  // Email verification
  app.get('/api/auth/verify', async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) { res.redirect('/auth/verify?error=no_token'); return; }

      const result = await verifyEmailToken(token);
      if (!result) { res.redirect('/auth/verify?error=invalid_token'); return; }

      res.redirect('/auth/verify?success=true');
    } catch (err) {
      console.error('[Auth] Verify error:', err);
      res.redirect('/auth/verify?error=server_error');
    }
  });
}

// ─── Session Token Helper ──────────────────────────────────────────────────────
async function createSessionToken(openId: string): Promise<string> {
  return sdk.createSessionToken(openId, { name: '', expiresInMs: ONE_YEAR_MS });
}
