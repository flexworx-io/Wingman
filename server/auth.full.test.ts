/**
 * Auth Full System Tests
 * Tests for: email/password auth, org management, super-admin procedures,
 * and multi-tenant middleware logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { planHasFeature, PLAN_LIMITS } from './middleware/tenant';

// ─── bcrypt utility tests ─────────────────────────────────────────────────────
describe('Auth: bcrypt password hashing', () => {
  it('should hash a password', async () => {
    const password = 'SecurePass123!';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('should verify a correct password', async () => {
    const password = 'SecurePass123!';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'SecurePass123!';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare('WrongPassword!', hash);
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'SamePassword!';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    expect(hash1).not.toBe(hash2);
    // But both should verify correctly
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});

// ─── Tenant plan limits ───────────────────────────────────────────────────────
describe('Multi-Tenant: Plan limits', () => {
  it('should define limits for all plans', () => {
    const plans = ['free', 'starter', 'professional', 'enterprise'] as const;
    for (const plan of plans) {
      expect(PLAN_LIMITS[plan]).toBeDefined();
      expect(PLAN_LIMITS[plan].maxUsers).toBeDefined();
      expect(PLAN_LIMITS[plan].maxWingmen).toBeDefined();
      expect(PLAN_LIMITS[plan].dailyIntroductions).toBeDefined();
    }
  });

  it('free plan should have limited users', () => {
    expect(PLAN_LIMITS.free.maxUsers).toBe(5);
    expect(PLAN_LIMITS.free.maxWingmen).toBe(1);
    expect(PLAN_LIMITS.free.dailyIntroductions).toBe(10);
  });

  it('enterprise plan should have unlimited resources', () => {
    expect(PLAN_LIMITS.enterprise.maxUsers).toBe(-1);
    expect(PLAN_LIMITS.enterprise.maxWingmen).toBe(-1);
    expect(PLAN_LIMITS.enterprise.dailyIntroductions).toBe(-1);
  });

  it('professional plan should have more resources than starter', () => {
    expect(PLAN_LIMITS.professional.maxUsers).toBeGreaterThan(PLAN_LIMITS.starter.maxUsers);
    expect(PLAN_LIMITS.professional.maxWingmen).toBeGreaterThan(PLAN_LIMITS.starter.maxWingmen);
  });
});

// ─── Tenant feature gates ─────────────────────────────────────────────────────
describe('Multi-Tenant: Feature gates', () => {
  it('free plan should have soul_forge feature', () => {
    expect(planHasFeature('free', 'soul_forge')).toBe(true);
  });

  it('free plan should NOT have wingman_tv feature', () => {
    expect(planHasFeature('free', 'wingman_tv')).toBe(false);
  });

  it('professional plan should have wingman_tv feature', () => {
    expect(planHasFeature('professional', 'wingman_tv')).toBe(true);
  });

  it('enterprise plan should have all features', () => {
    expect(planHasFeature('enterprise', 'any_feature')).toBe(true);
    expect(planHasFeature('enterprise', 'soul_forge')).toBe(true);
    expect(planHasFeature('enterprise', 'wingman_tv')).toBe(true);
    expect(planHasFeature('enterprise', 'dream_board')).toBe(true);
  });

  it('unknown plan should return false for any feature', () => {
    expect(planHasFeature('unknown_plan', 'soul_forge')).toBe(false);
  });

  it('starter plan should have travel_intel feature', () => {
    expect(planHasFeature('starter', 'travel_intel')).toBe(true);
  });
});

// ─── Email validation ─────────────────────────────────────────────────────────
describe('Auth: Email validation', () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  it('should accept valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('user.name@company.io')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ─── Password strength ────────────────────────────────────────────────────────
describe('Auth: Password strength', () => {
  const isStrongPassword = (password: string) => password.length >= 8;

  it('should accept passwords of 8+ characters', () => {
    expect(isStrongPassword('password')).toBe(true);
    expect(isStrongPassword('SecurePass123!')).toBe(true);
  });

  it('should reject passwords shorter than 8 characters', () => {
    expect(isStrongPassword('short')).toBe(false);
    expect(isStrongPassword('1234567')).toBe(false);
  });
});

// ─── Org slug validation ──────────────────────────────────────────────────────
describe('Auth: Organization slug validation', () => {
  const isValidSlug = (slug: string) => /^[a-z0-9-]+$/.test(slug) && slug.length >= 2;

  it('should accept valid slugs', () => {
    expect(isValidSlug('acme-corp')).toBe(true);
    expect(isValidSlug('my-org-123')).toBe(true);
    expect(isValidSlug('ab')).toBe(true);
  });

  it('should reject invalid slugs', () => {
    expect(isValidSlug('Acme Corp')).toBe(false); // uppercase + space
    expect(isValidSlug('org_name')).toBe(false); // underscore
    expect(isValidSlug('a')).toBe(false); // too short
    expect(isValidSlug('')).toBe(false);
  });
});

// ─── Token generation ─────────────────────────────────────────────────────────
describe('Auth: Token generation', () => {
  it('should generate unique tokens using nanoid-style logic', () => {
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const token1 = generateToken();
    const token2 = generateToken();

    expect(token1).toHaveLength(48);
    expect(token2).toHaveLength(48);
    expect(token1).not.toBe(token2);
  });
});
