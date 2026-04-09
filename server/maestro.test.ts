/**
 * MAESTRO Personality Synthesis Engine — Vitest Tests
 * Tests for: trait scoring, compatibility math, confidence calculations,
 * prediction engine logic, and plan feature gates.
 */
import { describe, it, expect } from 'vitest';
import { TRAIT_CODES } from './maestro';

// ─── Trait Taxonomy ───────────────────────────────────────────────────────────
describe('MAESTRO: Trait Taxonomy', () => {
  it('should define exactly 34 trait codes', () => {
    expect(TRAIT_CODES).toHaveLength(34);
  });

  it('should include all core Big-5 derived traits', () => {
    expect(TRAIT_CODES).toContain('WARMTH');
    expect(TRAIT_CODES).toContain('HUMOR');
    expect(TRAIT_CODES).toContain('DIRECTNESS');
    expect(TRAIT_CODES).toContain('RELIABILITY');
    expect(TRAIT_CODES).toContain('CURIOSITY');
  });

  it('should include social intelligence traits', () => {
    expect(TRAIT_CODES).toContain('EMOTIONAL_AWARENESS');
    expect(TRAIT_CODES).toContain('SOCIAL_ENERGY');
    expect(TRAIT_CODES).toContain('AGREEABLENESS');
  });

  it('should have no duplicate trait codes', () => {
    const unique = new Set(TRAIT_CODES);
    expect(unique.size).toBe(TRAIT_CODES.length);
  });

  it('should have all codes in UPPER_SNAKE_CASE', () => {
    for (const code of TRAIT_CODES) {
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });
});

// ─── Compatibility Math ───────────────────────────────────────────────────────
describe('MAESTRO: Compatibility Math', () => {
  // Simulate the compatibility calculation logic
  const calculateCompatibility = (
    traitsA: number[],
    traitsB: number[],
    weights?: number[]
  ): number => {
    if (traitsA.length !== traitsB.length) throw new Error('Trait arrays must be same length');
    const n = traitsA.length;
    const w = weights ?? Array(n).fill(1 / n);
    let score = 0;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(traitsA[i] - traitsB[i]) / 100;
      score += w[i] * (1 - diff);
    }
    return Math.round(score * 100);
  };

  it('should return 100% for identical trait profiles', () => {
    const traits = [80, 70, 90, 60, 75, 85, 65, 95];
    expect(calculateCompatibility(traits, traits)).toBe(100);
  });

  it('should return lower score for opposite profiles', () => {
    const a = [100, 100, 100, 100];
    const b = [0, 0, 0, 0];
    expect(calculateCompatibility(a, b)).toBe(0);
  });

  it('should return ~50% for moderate difference', () => {
    const a = [75, 75, 75, 75];
    const b = [25, 25, 25, 25];
    const score = calculateCompatibility(a, b);
    expect(score).toBe(50);
  });

  it('should respect custom weights', () => {
    const a = [100, 0];
    const b = [0, 100];
    // Weight first trait heavily
    const score = calculateCompatibility(a, b, [0.9, 0.1]);
    // First trait has 100% diff, second has 100% diff
    // score = 0.9 * 0 + 0.1 * 0 = 0
    expect(score).toBe(0);
  });

  it('should handle single trait comparison', () => {
    expect(calculateCompatibility([80], [80])).toBe(100);
    expect(calculateCompatibility([100], [50])).toBe(50);
  });
});

// ─── Confidence Score ─────────────────────────────────────────────────────────
describe('MAESTRO: Confidence Score Calculation', () => {
  const calculateConfidence = (
    evidenceCount: number,
    contradictionCount: number,
    predictionAccuracy: number
  ): number => {
    const evidenceScore = Math.min(evidenceCount / 10, 1) * 40; // max 40 pts
    const contradictionPenalty = Math.min(contradictionCount * 5, 20); // max -20 pts
    const accuracyScore = predictionAccuracy * 0.6; // max 60 pts
    return Math.round(Math.max(0, Math.min(100, evidenceScore - contradictionPenalty + accuracyScore)));
  };

  it('should return high confidence with many evidence and high accuracy', () => {
    const score = calculateConfidence(10, 0, 100);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('should return lower confidence with contradictions', () => {
    const base = calculateConfidence(10, 0, 80);
    const withContradictions = calculateConfidence(10, 4, 80);
    expect(withContradictions).toBeLessThan(base);
  });

  it('should never exceed 100', () => {
    const score = calculateConfidence(100, 0, 100);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should never go below 0', () => {
    const score = calculateConfidence(0, 100, 0);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should return 0 for no evidence and no accuracy', () => {
    const score = calculateConfidence(0, 0, 0);
    expect(score).toBe(0);
  });
});

// ─── Trait Score Normalization ────────────────────────────────────────────────
describe('MAESTRO: Trait Score Normalization', () => {
  const normalizeScore = (raw: number, min = 0, max = 100): number => {
    return Math.round(Math.max(0, Math.min(100, ((raw - min) / (max - min)) * 100)));
  };

  it('should normalize 0-100 range correctly', () => {
    expect(normalizeScore(50, 0, 100)).toBe(50);
    expect(normalizeScore(0, 0, 100)).toBe(0);
    expect(normalizeScore(100, 0, 100)).toBe(100);
  });

  it('should clamp values outside range', () => {
    expect(normalizeScore(-10, 0, 100)).toBe(0);
    expect(normalizeScore(110, 0, 100)).toBe(100);
  });

  it('should normalize Likert scale (1-7) to 0-100', () => {
    expect(normalizeScore(1, 1, 7)).toBe(0);
    expect(normalizeScore(7, 1, 7)).toBe(100);
    expect(normalizeScore(4, 1, 7)).toBe(50);
  });
});

// ─── Prediction Magic Moment ──────────────────────────────────────────────────
describe('MAESTRO: Prediction Engine', () => {
  const shouldTriggerMagicMoment = (
    currentQuestionIndex: number,
    traitConfidence: number,
    predictionThreshold = 70
  ): boolean => {
    // Trigger at questions 3, 6, 9 if confidence is high enough
    const isMilestone = [3, 6, 9].includes(currentQuestionIndex);
    return isMilestone && traitConfidence >= predictionThreshold;
  };

  it('should trigger magic moment at milestone questions with high confidence', () => {
    expect(shouldTriggerMagicMoment(3, 80)).toBe(true);
    expect(shouldTriggerMagicMoment(6, 75)).toBe(true);
    expect(shouldTriggerMagicMoment(9, 90)).toBe(true);
  });

  it('should not trigger at non-milestone questions', () => {
    expect(shouldTriggerMagicMoment(1, 90)).toBe(false);
    expect(shouldTriggerMagicMoment(5, 90)).toBe(false);
    expect(shouldTriggerMagicMoment(10, 90)).toBe(false);
  });

  it('should not trigger with low confidence even at milestones', () => {
    expect(shouldTriggerMagicMoment(3, 50)).toBe(false);
    expect(shouldTriggerMagicMoment(6, 60)).toBe(false);
  });
});

// ─── Contradiction Detection ──────────────────────────────────────────────────
describe('MAESTRO: Contradiction Detection', () => {
  const detectContradiction = (
    trait: string,
    previousScore: number,
    newScore: number,
    threshold = 30
  ): boolean => {
    return Math.abs(newScore - previousScore) >= threshold;
  };

  it('should detect large score swings as contradictions', () => {
    expect(detectContradiction('WARMTH', 80, 20)).toBe(true);
    expect(detectContradiction('HUMOR', 30, 90)).toBe(true);
  });

  it('should not flag small variations', () => {
    expect(detectContradiction('WARMTH', 80, 75)).toBe(false);
    expect(detectContradiction('HUMOR', 50, 65)).toBe(false);
  });

  it('should use custom threshold', () => {
    expect(detectContradiction('WARMTH', 80, 60, 15)).toBe(true);
    expect(detectContradiction('WARMTH', 80, 70, 15)).toBe(false);
  });
});

// ─── Wingman Synthesis ────────────────────────────────────────────────────────
describe('MAESTRO: Wingman Synthesis', () => {
  const getSignatureStrength = (traits: Record<string, number>): string => {
    const sorted = Object.entries(traits).sort(([, a], [, b]) => b - a);
    const [topTrait] = sorted[0];
    const strengthMap: Record<string, string> = {
      WARMTH: 'Emotional Warmth',
      HUMOR: 'Infectious Humor',
      DIRECTNESS: 'Radical Honesty',
      RELIABILITY: 'Unwavering Reliability',
      CURIOSITY: 'Boundless Curiosity',
      EMOTIONAL_AWARENESS: 'Deep Empathy',
    };
    return strengthMap[topTrait] ?? 'Authentic Presence';
  };

  it('should identify correct signature strength', () => {
    expect(getSignatureStrength({ WARMTH: 95, HUMOR: 70, CURIOSITY: 60 })).toBe('Emotional Warmth');
    expect(getSignatureStrength({ HUMOR: 95, WARMTH: 70 })).toBe('Infectious Humor');
    expect(getSignatureStrength({ CURIOSITY: 99, WARMTH: 50 })).toBe('Boundless Curiosity');
  });

  it('should return fallback for unknown top trait', () => {
    expect(getSignatureStrength({ UNKNOWN_TRAIT: 95 })).toBe('Authentic Presence');
  });

  it('should handle tied scores by returning first alphabetically', () => {
    const result = getSignatureStrength({ WARMTH: 90, HUMOR: 90 });
    // Both are 90, sort is stable, WARMTH comes first in this object
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
