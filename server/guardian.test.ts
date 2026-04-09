/**
 * Guardian Shield Risk Engine Tests
 * Tests risk scoring math, severity band thresholds, and edge cases.
 */

import { describe, it, expect } from "vitest";

// ─── Risk scoring logic (replicated from riskEngine.ts for unit testing) ──────

type RiskType =
  | "grooming"
  | "scam"
  | "violence"
  | "self_harm"
  | "meetup_risk"
  | "identity_deception";

type SeverityBand = "none" | "low" | "medium" | "high" | "critical";

function getSeverityBand(score: number): SeverityBand {
  if (score < 10) return "none";
  if (score < 30) return "low";
  if (score < 60) return "medium";
  if (score < 80) return "high";
  return "critical";
}

function getInterventionLevel(band: SeverityBand): string {
  switch (band) {
    case "none":    return "none";
    case "low":     return "monitor";
    case "medium":  return "warn_user";
    case "high":    return "block_interaction";
    case "critical": return "emergency_escalate";
  }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function aggregateRiskScores(scores: number[], weights?: number[]): number {
  if (scores.length === 0) return 0;
  if (!weights) {
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weighted = scores.reduce((sum, score, i) => sum + score * (weights[i] ?? 1), 0);
  return weighted / totalWeight;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Guardian Shield: Severity Band Thresholds", () => {
  it("score 0 should be 'none'", () => {
    expect(getSeverityBand(0)).toBe("none");
  });

  it("score 9 should be 'none'", () => {
    expect(getSeverityBand(9)).toBe("none");
  });

  it("score 10 should be 'low'", () => {
    expect(getSeverityBand(10)).toBe("low");
  });

  it("score 29 should be 'low'", () => {
    expect(getSeverityBand(29)).toBe("low");
  });

  it("score 30 should be 'medium'", () => {
    expect(getSeverityBand(30)).toBe("medium");
  });

  it("score 59 should be 'medium'", () => {
    expect(getSeverityBand(59)).toBe("medium");
  });

  it("score 60 should be 'high'", () => {
    expect(getSeverityBand(60)).toBe("high");
  });

  it("score 79 should be 'high'", () => {
    expect(getSeverityBand(79)).toBe("high");
  });

  it("score 80 should be 'critical'", () => {
    expect(getSeverityBand(80)).toBe("critical");
  });

  it("score 100 should be 'critical'", () => {
    expect(getSeverityBand(100)).toBe("critical");
  });
});

describe("Guardian Shield: Intervention Level Mapping", () => {
  it("'none' band → 'none' intervention", () => {
    expect(getInterventionLevel("none")).toBe("none");
  });

  it("'low' band → 'monitor' intervention", () => {
    expect(getInterventionLevel("low")).toBe("monitor");
  });

  it("'medium' band → 'warn_user' intervention", () => {
    expect(getInterventionLevel("medium")).toBe("warn_user");
  });

  it("'high' band → 'block_interaction' intervention", () => {
    expect(getInterventionLevel("high")).toBe("block_interaction");
  });

  it("'critical' band → 'emergency_escalate' intervention", () => {
    expect(getInterventionLevel("critical")).toBe("emergency_escalate");
  });
});

describe("Guardian Shield: Score Clamping", () => {
  it("should clamp negative scores to 0", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(-0.001)).toBe(0);
  });

  it("should clamp scores above 100 to 100", () => {
    expect(clampScore(101)).toBe(100);
    expect(clampScore(999)).toBe(100);
  });

  it("should not modify scores within 0-100", () => {
    expect(clampScore(0)).toBe(0);
    expect(clampScore(50)).toBe(50);
    expect(clampScore(100)).toBe(100);
  });
});

describe("Guardian Shield: Risk Score Aggregation", () => {
  it("should return 0 for empty score array", () => {
    expect(aggregateRiskScores([])).toBe(0);
  });

  it("should return the score itself for single-element array", () => {
    expect(aggregateRiskScores([75])).toBe(75);
  });

  it("should average scores without weights", () => {
    expect(aggregateRiskScores([20, 40, 60])).toBe(40);
  });

  it("should apply weights correctly", () => {
    // score 10 weight 1, score 90 weight 3 → (10*1 + 90*3) / (1+3) = 280/4 = 70
    expect(aggregateRiskScores([10, 90], [1, 3])).toBe(70);
  });

  it("equal weights should produce same result as unweighted", () => {
    const scores = [20, 40, 60];
    const weights = [1, 1, 1];
    expect(aggregateRiskScores(scores, weights)).toBeCloseTo(aggregateRiskScores(scores), 5);
  });

  it("higher weight on high-risk score should raise aggregate", () => {
    const lowWeighted = aggregateRiskScores([10, 90], [3, 1]); // weighted toward low
    const highWeighted = aggregateRiskScores([10, 90], [1, 3]); // weighted toward high
    expect(highWeighted).toBeGreaterThan(lowWeighted);
  });
});

describe("Guardian Shield: End-to-End Risk Pipeline", () => {
  it("safe user profile should produce 'none' severity", () => {
    const score = aggregateRiskScores([2, 3, 1, 0, 2, 1]);
    const band = getSeverityBand(score);
    expect(band).toBe("none");
    expect(getInterventionLevel(band)).toBe("none");
  });

  it("suspicious profile should produce at least 'medium' severity", () => {
    const score = aggregateRiskScores([45, 50, 40, 35, 55, 45]);
    const band = getSeverityBand(score);
    expect(["medium", "high", "critical"]).toContain(band);
  });

  it("high-risk profile should trigger block or escalate", () => {
    const score = aggregateRiskScores([85, 90, 75, 80, 88, 92]);
    const band = getSeverityBand(score);
    const intervention = getInterventionLevel(band);
    expect(["block_interaction", "emergency_escalate"]).toContain(intervention);
  });

  it("critical single signal should escalate even with low others", () => {
    // One critical signal (95) with high weight should dominate
    const score = aggregateRiskScores([5, 5, 95], [1, 1, 5]);
    const band = getSeverityBand(score);
    expect(["high", "critical"]).toContain(band);
  });
});

describe("Guardian Shield: Risk Type Coverage", () => {
  const riskTypes: RiskType[] = [
    "grooming",
    "scam",
    "violence",
    "self_harm",
    "meetup_risk",
    "identity_deception",
  ];

  it("should cover all 6 risk types", () => {
    expect(riskTypes).toHaveLength(6);
  });

  it("each risk type should be a non-empty string", () => {
    for (const type of riskTypes) {
      expect(type).toBeTruthy();
      expect(typeof type).toBe("string");
    }
  });

  it("risk types should not have duplicates", () => {
    const unique = new Set(riskTypes);
    expect(unique.size).toBe(riskTypes.length);
  });
});
