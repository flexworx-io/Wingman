/**
 * MAESTRO Personality Synthesis Engine
 * 6-Layer AI Personality Analysis and Wingman Synthesis System
 *
 * Layer 1: Rapport Interview
 * Layer 2: Trait Inference Engine
 * Layer 3: Prediction Engine
 * Layer 4: Contradiction + Calibration Engine
 * Layer 5: Companion Needs Engine
 * Layer 6: Companion Synthesis Engine
 */

import { invokeLLM } from "./_core/llm";

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT TAXONOMY — 34 PRIMARY TRAITS
// ═══════════════════════════════════════════════════════════════════════════════

export const TRAIT_CODES = [
  "WARMTH",
  "HUMOR",
  "DIRECTNESS",
  "RELIABILITY",
  "INITIATIVE",
  "RESILIENCE",
  "EMOTIONAL_AWARENESS",
  "SOCIAL_ENERGY",
  "CURIOSITY",
  "AGREEABLENESS",
  "STRUCTURED_VS_FLEXIBLE",
  "PRACTICAL_VS_IMAGINATIVE",
  "FORMALITY",
  "HONESTY_OPENNESS",
  "TRUST",
  "RESPONSE_SPEED",
  "ATTENTION_TO_DETAIL",
  "ADAPTABILITY",
  "CONFIDENCE",
  "PATIENCE",
  "CREATIVITY",
  "AMBITION",
  "EMPATHY",
  "OPTIMISM",
  "ASSERTIVENESS",
  "PLAYFULNESS",
  "LOYALTY",
  "INDEPENDENCE",
  "COMMUNICATION_STYLE",
  "CONFLICT_RESOLUTION",
  "SPONTANEITY",
  "DEPTH_VS_BREADTH",
  "ENERGY_LEVEL",
  "VULNERABILITY",
] as const;

export type TraitCode = (typeof TRAIT_CODES)[number];

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE WEIGHTS (configurable)
// ═══════════════════════════════════════════════════════════════════════════════

export const SOURCE_WEIGHTS = {
  interview_transcript: 0.24,
  voice_tone: 0.14,
  rapid_preference: 0.12,
  scenario_response: 0.16,
  direct_preference: 0.12,
  prediction_validation: 0.12,
  contradiction_followup: 0.10,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE COEFFICIENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const CONFIDENCE_COEFFICIENTS = {
  alpha: 0.45, // evidence coverage weight
  beta: 0.35,  // prediction agreement weight
  gamma: 0.20, // contradiction penalty weight
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANION NEEDS COEFFICIENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const NEEDS_COEFFICIENTS = {
  lambda1: 0.40, // explicit desired trait
  lambda2: 0.45, // friction gap (what they actually need)
  lambda3: 0.15, // relationship-mode weighting
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHEMISTRY SCORE WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

export const CHEMISTRY_WEIGHTS = {
  similarity: 0.35,
  supportFit: 0.40,
  frictionReduction: 0.25,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SAFETY FLOORS
// ═══════════════════════════════════════════════════════════════════════════════

export const SAFETY_FLOORS: Partial<Record<TraitCode, number>> = {
  AGREEABLENESS: 68,
  WARMTH: 72,
  EMOTIONAL_AWARENESS: 70,
  RELIABILITY: 70,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT SYNTHESIS MODES
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPLEMENT_TRAITS: TraitCode[] = [
  "RELIABILITY", "STRUCTURED_VS_FLEXIBLE", "INITIATIVE",
  "RESILIENCE", "RESPONSE_SPEED", "ATTENTION_TO_DETAIL"
];

export const MIRROR_TRAITS: TraitCode[] = [
  "HUMOR", "WARMTH", "PRACTICAL_VS_IMAGINATIVE",
  "SOCIAL_ENERGY", "FORMALITY", "CURIOSITY"
];

export const SAFETY_FLOOR_TRAITS: TraitCode[] = [
  "AGREEABLENESS", "WARMTH", "EMOTIONAL_AWARENESS",
  "RELIABILITY", "HONESTY_OPENNESS", "TRUST"
];

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT-SPECIFIC SYNTHESIS FORMULAS
// ═══════════════════════════════════════════════════════════════════════════════

export const TRAIT_SYNTHESIS_FORMULAS: Partial<Record<TraitCode, {
  m: number; n: number; s: number; // weights must sum to 1
  mode: "complement" | "mirror" | "safety";
}>> = {
  RELIABILITY:           { m: 0.25, n: 0.60, s: 0.15, mode: "complement" },
  HUMOR:                 { m: 0.70, n: 0.20, s: 0.10, mode: "mirror" },
  DIRECTNESS:            { m: 0.30, n: 0.50, s: 0.20, mode: "complement" },
  WARMTH:                { m: 0.50, n: 0.25, s: 0.25, mode: "safety" },
  STRUCTURED_VS_FLEXIBLE:{ m: 0.15, n: 0.65, s: 0.20, mode: "complement" },
  INITIATIVE:            { m: 0.20, n: 0.55, s: 0.25, mode: "complement" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TraitVector = Record<TraitCode, number>;
export type ConfidenceVector = Record<TraitCode, number>;
export type FrictionVector = Partial<Record<TraitCode, number>>;

export interface TraitEvidenceInput {
  traitCode: TraitCode;
  sourceType: keyof typeof SOURCE_WEIGHTS;
  rawScore: number; // 0–100
}

export interface PredictionMoment {
  questionId: string;
  predictedDistribution: Record<string, number>;
  revealCopy: string;
  traitSignals: TraitCode[];
}

export interface ContradictionResult {
  traitCode: TraitCode;
  selfValue: number;
  observedValue: number;
  predictedValue: number;
  contradictionScore: number;
  insightType: "aspirational_identity" | "self_deception" | "hidden_pain" | "context_dependent" | "blind_spot";
}

export interface SynthesisResult {
  wingmanTraitVector: TraitVector;
  chemistryScore: number;
  overallConfidence: number;
  explanation: string;
  name: string;
  tagline: string;
  catchphrase: string;
  aboutMe: string;
  avatarPrompt: string;
  voiceProfile: string;
  originCardCopy: string;
  whyWeMatchedCopy: string;
  futureYouMode: string;
  predictionMagicMoments: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: TRAIT INFERENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute user trait vector U using weighted average across sources.
 * U_t = (Σ (w_i * s_ti)) / (Σ w_i)
 */
export function computeUserTraitVector(evidenceList: TraitEvidenceInput[]): TraitVector {
  const sums: Partial<Record<TraitCode, number>> = {};
  const weightSums: Partial<Record<TraitCode, number>> = {};

  for (const ev of evidenceList) {
    const w = SOURCE_WEIGHTS[ev.sourceType] ?? 0.1;
    const normalized = Math.max(0, Math.min(100, ev.rawScore));
    sums[ev.traitCode] = (sums[ev.traitCode] ?? 0) + w * normalized;
    weightSums[ev.traitCode] = (weightSums[ev.traitCode] ?? 0) + w;
  }

  const vector = {} as TraitVector;
  for (const trait of TRAIT_CODES) {
    const s = sums[trait] ?? 50;
    const w = weightSums[trait] ?? 1;
    vector[trait] = Math.round((s / w) * 10) / 10;
  }
  return vector;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * C_t = αE_t + βA_t + γ(1 - X_t)
 */
export function computeConfidenceVector(
  traitVector: TraitVector,
  evidenceList: TraitEvidenceInput[],
  predictionAccuracy: number,
  contradictionVector: FrictionVector
): ConfidenceVector {
  const { alpha, beta, gamma } = CONFIDENCE_COEFFICIENTS;
  const evidenceCoverage: Partial<Record<TraitCode, number>> = {};

  // Count evidence sources per trait
  const sourceCounts: Partial<Record<TraitCode, Set<string>>> = {};
  for (const ev of evidenceList) {
    if (!sourceCounts[ev.traitCode]) sourceCounts[ev.traitCode] = new Set();
    sourceCounts[ev.traitCode]!.add(ev.sourceType);
  }

  const maxSources = Object.keys(SOURCE_WEIGHTS).length;
  for (const trait of TRAIT_CODES) {
    const count = sourceCounts[trait]?.size ?? 0;
    evidenceCoverage[trait] = count / maxSources;
  }

  const confidenceVector = {} as ConfidenceVector;
  for (const trait of TRAIT_CODES) {
    const E = evidenceCoverage[trait] ?? 0;
    const A = predictionAccuracy;
    const X = Math.min(1, (contradictionVector[trait] ?? 0) / 100);
    const C = alpha * E + beta * A + gamma * (1 - X);
    confidenceVector[trait] = Math.round(Math.max(0, Math.min(1, C)) * 1000) / 1000;
  }
  return confidenceVector;
}

export function getConfidenceBand(c: number): "high" | "solid" | "low" | "insufficient" {
  if (c >= 0.90) return "high";
  if (c >= 0.75) return "solid";
  if (c >= 0.60) return "low";
  return "insufficient";
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: PREDICTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * For continuous response: P_q = 1 - (|predicted - actual| / range)
 * Overall: P = (Σ (P_q * importance_q)) / (Σ importance_q)
 */
export function computePredictionAccuracy(
  predictions: Array<{
    predicted: number;
    actual: number;
    range: number;
    importance: number;
  }>
): number {
  if (predictions.length === 0) return 0.5;

  let weightedSum = 0;
  let totalImportance = 0;

  for (const p of predictions) {
    const accuracy = 1 - Math.abs(p.predicted - p.actual) / p.range;
    weightedSum += Math.max(0, accuracy) * p.importance;
    totalImportance += p.importance;
  }

  return totalImportance > 0 ? weightedSum / totalImportance : 0.5;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4: CONTRADICTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * X_t = ( |self_t - observed_t| + |stated_t - predicted_t| ) / 2
 */
export function computeContradictionVector(
  selfReported: Partial<TraitVector>,
  observed: Partial<TraitVector>,
  predicted: Partial<TraitVector>
): FrictionVector {
  const contradictions: FrictionVector = {};
  for (const trait of TRAIT_CODES) {
    const self = selfReported[trait];
    const obs = observed[trait];
    const pred = predicted[trait];
    if (self !== undefined && obs !== undefined) {
      const part1 = Math.abs(self - obs);
      const part2 = pred !== undefined ? Math.abs(self - pred) : 0;
      contradictions[trait] = (part1 + part2) / 2;
    }
  }
  return contradictions;
}

export function classifyContradiction(score: number): ContradictionResult["insightType"] {
  if (score > 30) return "aspirational_identity";
  if (score > 20) return "self_deception";
  if (score > 15) return "hidden_pain";
  if (score > 10) return "context_dependent";
  return "blind_spot";
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5: COMPANION NEEDS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * D_t = desired_t - actual_t (friction gap)
 * N_t = λ1G_t + λ2D_t + λ3R_t
 */
export function computeFrictionVector(
  userTraits: TraitVector,
  desiredTraits: Partial<TraitVector>
): FrictionVector {
  const friction: FrictionVector = {};
  for (const trait of TRAIT_CODES) {
    const desired = desiredTraits[trait];
    if (desired !== undefined) {
      friction[trait] = desired - userTraits[trait];
    }
  }
  return friction;
}

export function computeNeedsVector(
  explicitDesired: Partial<TraitVector>,
  frictionVector: FrictionVector,
  relationshipModeWeights: Partial<TraitVector>
): Partial<TraitVector> {
  const { lambda1, lambda2, lambda3 } = NEEDS_COEFFICIENTS;
  const needs: Partial<TraitVector> = {};

  for (const trait of TRAIT_CODES) {
    const G = explicitDesired[trait] ?? 50;
    const D = frictionVector[trait] ?? 0;
    const R = relationshipModeWeights[trait] ?? 50;
    needs[trait] = Math.max(0, Math.min(100,
      lambda1 * G + lambda2 * D + lambda3 * R
    ));
  }
  return needs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 6: COMPANION SYNTHESIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * W_t = m_t * Comp_t + n_t * Mirror_t + s_t * Safety_t
 */
export function synthesizeWingmanTraitVector(
  userTraits: TraitVector,
  needsVector: Partial<TraitVector>,
  frictionVector: FrictionVector,
  desiredTraits: Partial<TraitVector>
): TraitVector {
  const wingman = {} as TraitVector;

  for (const trait of TRAIT_CODES) {
    const U = userTraits[trait];
    const N = needsVector[trait] ?? U;
    const D = frictionVector[trait] ?? 0;
    const G = desiredTraits[trait] ?? U;
    const floor = SAFETY_FLOORS[trait] ?? 0;

    // Get synthesis formula for this trait
    const formula = TRAIT_SYNTHESIS_FORMULAS[trait];
    const m = formula?.m ?? 0.33;
    const n = formula?.n ?? 0.34;
    const s = formula?.s ?? 0.33;

    // Complement component: offset user's gaps
    let Comp: number;
    if (COMPLEMENT_TRAITS.includes(trait)) {
      Comp = Math.min(100, U + Math.abs(D));
    } else {
      Comp = 100 - U;
    }

    // Mirror component: stay close to user
    const Mirror = MIRROR_TRAITS.includes(trait)
      ? 0.85 * U + 0.15 * G
      : U;

    // Safety component: ensure minimum healthy threshold
    const Safety = Math.max(floor, N);

    let W = m * Comp + n * Mirror + s * Safety;

    // Apply safety floors
    if (floor > 0) {
      W = Math.max(floor, W);
    }

    // Clamp to 0–100
    wingman[trait] = Math.round(Math.max(0, Math.min(100, W)) * 10) / 10;
  }

  return wingman;
}

/**
 * Chemistry = 0.35Similarity + 0.40SupportFit + 0.25FrictionReduction
 */
export function computeChemistryScore(
  userTraits: TraitVector,
  wingmanTraits: TraitVector,
  frictionVector: FrictionVector
): number {
  const similarityTraits: TraitCode[] = ["HUMOR", "WARMTH", "SOCIAL_ENERGY", "PRACTICAL_VS_IMAGINATIVE", "FORMALITY"];
  const supportTraits: TraitCode[] = ["RELIABILITY", "INITIATIVE", "RESILIENCE", "STRUCTURED_VS_FLEXIBLE", "EMOTIONAL_AWARENESS"];

  // Similarity: how close are vibe traits
  let similaritySum = 0;
  for (const t of similarityTraits) {
    const diff = Math.abs(userTraits[t] - wingmanTraits[t]);
    similaritySum += 1 - diff / 100;
  }
  const similarity = similaritySum / similarityTraits.length;

  // Support fit: how well wingman fills gaps
  let supportSum = 0;
  for (const t of supportTraits) {
    const gap = frictionVector[t] ?? 0;
    const filled = gap > 0 ? Math.min(1, (wingmanTraits[t] - userTraits[t]) / Math.max(1, gap)) : 0.8;
    supportSum += Math.max(0, filled);
  }
  const supportFit = supportSum / supportTraits.length;

  // Friction reduction: projected improvement
  const frictionValues = Object.values(frictionVector).filter(v => v !== undefined) as number[];
  const avgFriction = frictionValues.length > 0
    ? frictionValues.reduce((a, b) => a + Math.abs(b), 0) / frictionValues.length
    : 0;
  const frictionReduction = Math.max(0, 1 - avgFriction / 50);

  const chemistry = CHEMISTRY_WEIGHTS.similarity * similarity
    + CHEMISTRY_WEIGHTS.supportFit * supportFit
    + CHEMISTRY_WEIGHTS.frictionReduction * frictionReduction;

  return Math.round(Math.max(0, Math.min(1, chemistry)) * 1000) / 1000;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION MAGIC MOMENTS GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const PREDICTION_MAGIC_TEMPLATES = [
  "You seem like someone who carries more than you show.",
  "I think you hate disappointing people, even when it costs you.",
  "You want honesty — but only from people you deeply trust.",
  "You move fast mentally, but life gets chaotic around your edges.",
  "You're the one who holds things together while quietly wishing someone would hold things together for you.",
  "You're more sensitive than you let on — and that's actually a superpower.",
  "You've probably been told you're 'too much' — but the right people think you're exactly enough.",
  "You set high standards because you know what's possible. That's not perfectionism. That's vision.",
  "You're loyal to a fault — and you've been burned for it before.",
  "You process things deeply before you speak. People mistake that for hesitation. It's actually precision.",
];

export function selectPredictionMagicMoment(
  traitVector: Partial<TraitVector>,
  questionCount: number
): { copy: string; traitSignals: TraitCode[] } {
  // Select based on dominant traits
  const dominantTraits = Object.entries(traitVector)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 3)
    .map(([t]) => t as TraitCode);

  const index = questionCount % PREDICTION_MAGIC_TEMPLATES.length;
  return {
    copy: PREDICTION_MAGIC_TEMPLATES[index],
    traitSignals: dominantTraits,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: RAPPORT INTERVIEW — QUESTION BANK
// ═══════════════════════════════════════════════════════════════════════════════

export interface InterviewQuestion {
  id: string;
  text: string;
  type: "open" | "scale" | "choice" | "scenario" | "rapid";
  traitSignals: TraitCode[];
  importance: number;
  layer: 1 | 2 | 3 | 4;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Layer 1 — Rapport (warm, open)
  {
    id: "q_open_1",
    text: "Tell me about a moment recently where you felt completely yourself. What were you doing?",
    type: "open",
    traitSignals: ["SOCIAL_ENERGY", "WARMTH", "VULNERABILITY"],
    importance: 0.9,
    layer: 1,
  },
  {
    id: "q_open_2",
    text: "What's something most people get wrong about you when they first meet you?",
    type: "open",
    traitSignals: ["DIRECTNESS", "CONFIDENCE", "VULNERABILITY"],
    importance: 0.85,
    layer: 1,
  },
  {
    id: "q_open_3",
    text: "Describe your ideal Saturday — from the moment you wake up.",
    type: "open",
    traitSignals: ["SOCIAL_ENERGY", "SPONTANEITY", "STRUCTURED_VS_FLEXIBLE"],
    importance: 0.8,
    layer: 1,
  },
  // Layer 2 — Trait probing
  {
    id: "q_scale_1",
    text: "On a scale of 1–10, how much do you prefer having a plan vs. going with the flow?",
    type: "scale",
    traitSignals: ["STRUCTURED_VS_FLEXIBLE", "SPONTANEITY", "ADAPTABILITY"],
    importance: 0.85,
    layer: 2,
  },
  {
    id: "q_scale_2",
    text: "How comfortable are you being the one who initiates plans with friends?",
    type: "scale",
    traitSignals: ["INITIATIVE", "SOCIAL_ENERGY", "CONFIDENCE"],
    importance: 0.8,
    layer: 2,
  },
  {
    id: "q_choice_1",
    text: "When a friend is upset, you're more likely to: (A) Give them space, (B) Check in immediately, (C) Distract them with humor, (D) Help them problem-solve",
    type: "choice",
    traitSignals: ["EMOTIONAL_AWARENESS", "WARMTH", "HUMOR", "DIRECTNESS"],
    importance: 0.9,
    layer: 2,
  },
  {
    id: "q_scenario_1",
    text: "A close friend cancels on you last minute for the third time this month. What do you do?",
    type: "scenario",
    traitSignals: ["DIRECTNESS", "RESILIENCE", "CONFLICT_RESOLUTION", "LOYALTY"],
    importance: 0.95,
    layer: 2,
  },
  // Layer 3 — Prediction probes
  {
    id: "q_rapid_1",
    text: "Quick: morning person or night owl?",
    type: "rapid",
    traitSignals: ["ENERGY_LEVEL", "STRUCTURED_VS_FLEXIBLE"],
    importance: 0.5,
    layer: 3,
  },
  {
    id: "q_rapid_2",
    text: "Quick: text or call?",
    type: "rapid",
    traitSignals: ["COMMUNICATION_STYLE", "SOCIAL_ENERGY", "DIRECTNESS"],
    importance: 0.6,
    layer: 3,
  },
  {
    id: "q_scenario_2",
    text: "You're at a party where you only know the host. What are you doing an hour in?",
    type: "scenario",
    traitSignals: ["SOCIAL_ENERGY", "CONFIDENCE", "WARMTH", "CURIOSITY"],
    importance: 0.9,
    layer: 3,
  },
  // Layer 4 — Deep inference
  {
    id: "q_open_4",
    text: "What's something you want more of in your friendships that you rarely ask for?",
    type: "open",
    traitSignals: ["VULNERABILITY", "DIRECTNESS", "EMOTIONAL_AWARENESS", "TRUST"],
    importance: 0.95,
    layer: 4,
  },
  {
    id: "q_open_5",
    text: "When was the last time you felt truly supported by someone? What did they do?",
    type: "open",
    traitSignals: ["WARMTH", "TRUST", "EMOTIONAL_AWARENESS", "LOYALTY"],
    importance: 0.9,
    layer: 4,
  },
  {
    id: "q_scenario_3",
    text: "You're working on something important and you're behind. A friend asks for a big favor. What happens?",
    type: "scenario",
    traitSignals: ["RELIABILITY", "ASSERTIVENESS", "CONFLICT_RESOLUTION", "AMBITION"],
    importance: 0.85,
    layer: 4,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LLM-POWERED TRAIT INFERENCE FROM INTERVIEW ANSWER
// ═══════════════════════════════════════════════════════════════════════════════

export async function inferTraitsFromAnswer(
  question: InterviewQuestion,
  answer: string,
  existingTraits: Partial<TraitVector>
): Promise<TraitEvidenceInput[]> {
  const relevantTraits = question.traitSignals;

  const prompt = `You are a personality analyst using the MAESTRO system. Analyze this interview answer and score the relevant traits.

Question: "${question.text}"
Answer: "${answer}"

Score these traits on a 0-100 scale based ONLY on what the answer reveals:
${relevantTraits.map(t => `- ${t}`).join("\n")}

Existing context (for calibration):
${Object.entries(existingTraits).slice(0, 5).map(([t, v]) => `${t}: ${v}`).join(", ")}

Return JSON array: [{"traitCode": "TRAIT_NAME", "rawScore": 0-100, "explanation": "brief reason"}]
Be specific. Neutral/no signal = 50. High = 75-90. Very high = 90+. Low = 10-30.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a precise personality analyst. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trait_scores",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scores: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    traitCode: { type: "string" },
                    rawScore: { type: "number" },
                    explanation: { type: "string" },
                  },
                  required: ["traitCode", "rawScore", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["scores"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content)) as { scores: Array<{ traitCode: string; rawScore: number; explanation: string }> };
    return parsed.scores
      .filter(s => TRAIT_CODES.includes(s.traitCode as TraitCode))
      .map(s => ({
        traitCode: s.traitCode as TraitCode,
        sourceType: "interview_transcript" as const,
        rawScore: Math.max(0, Math.min(100, s.rawScore)),
      }));
  } catch {
    // Fallback: return neutral scores
    return relevantTraits.map(t => ({
      traitCode: t,
      sourceType: "interview_transcript" as const,
      rawScore: 50,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LLM-POWERED WINGMAN IDENTITY GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateWingmanIdentity(
  userTraits: TraitVector,
  wingmanTraits: TraitVector,
  chemistryScore: number,
  userName: string,
  mode: string
): Promise<{
  name: string;
  tagline: string;
  catchphrase: string;
  aboutMe: string;
  avatarPrompt: string;
  voiceProfile: string;
  explanation: string;
  originCardCopy: string;
  whyWeMatchedCopy: string;
  futureYouMode: string;
}> {
  const topUserTraits = Object.entries(userTraits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([t, v]) => `${t}: ${v}`)
    .join(", ");

  const topWingmanTraits = Object.entries(wingmanTraits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([t, v]) => `${t}: ${v}`)
    .join(", ");

  const prompt = `You are the MAESTRO Wingman Identity Generator. Create a vivid, emotionally resonant AI companion identity.

User: ${userName}
Mode: ${mode}
User's top traits: ${topUserTraits}
Wingman's synthesized traits: ${topWingmanTraits}
Chemistry score: ${(chemistryScore * 100).toFixed(0)}%

Generate a complete Wingman identity. The name should feel like a real person's name (not robotic). The personality should feel like the perfect best friend/companion for this specific person.

Return JSON with these exact fields:
- name: A warm, memorable name (first name only, human-feeling)
- tagline: A 6-10 word tagline capturing the Wingman's essence
- catchphrase: A signature phrase the Wingman would say (conversational, memorable)
- aboutMe: 2-3 sentences about the Wingman's personality (first person, warm, specific)
- avatarPrompt: A detailed image generation prompt for the Wingman's avatar (abstract/artistic, not photorealistic human)
- voiceProfile: Description of voice tone and communication style (2 sentences)
- explanation: Emotionally intelligent explanation of why this Wingman was built for this user (3-4 sentences, specific, flattering but honest)
- originCardCopy: The text for the shareable "Meet [Name]" card (2-3 sentences, social-media worthy)
- whyWeMatchedCopy: Social-shareable explanation of the match (2-3 sentences, highlight complementary traits)
- futureYouMode: Description of the Wingman designed for who the user is becoming (2 sentences, aspirational)`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a creative AI identity designer. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "wingman_identity",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              tagline: { type: "string" },
              catchphrase: { type: "string" },
              aboutMe: { type: "string" },
              avatarPrompt: { type: "string" },
              voiceProfile: { type: "string" },
              explanation: { type: "string" },
              originCardCopy: { type: "string" },
              whyWeMatchedCopy: { type: "string" },
              futureYouMode: { type: "string" },
            },
            required: ["name", "tagline", "catchphrase", "aboutMe", "avatarPrompt", "voiceProfile", "explanation", "originCardCopy", "whyWeMatchedCopy", "futureYouMode"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content");
    return JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  } catch {
    return {
      name: "Aria",
      tagline: "Your most reliable, real, and ready companion",
      catchphrase: "I've got your back from here.",
      aboutMe: "I'm the kind of friend who shows up — not just when things are good, but especially when they're not. I'm direct when you need truth, warm when you need comfort, and always in your corner.",
      avatarPrompt: "Abstract aurora borealis entity, swirling violet and gold energy, cosmic consciousness, digital art, premium quality",
      voiceProfile: "Warm and grounded with a hint of playfulness. Speaks with clarity and conviction, never condescending.",
      explanation: `We built your Wingman to complement your energy with exactly what you need most. The synthesis found that you thrive with someone who matches your depth while filling in the gaps you don't always admit to having.`,
      originCardCopy: `Meet Aria — the AI companion built specifically for ${userName}. Not a generic assistant. A personality synthesized from 34 traits to be exactly who you need.`,
      whyWeMatchedCopy: "Your Wingman was built to complement your strengths and quietly fill in the gaps — the kind of match that feels less like luck and more like it was always meant to happen.",
      futureYouMode: "As you grow into your next chapter, your Wingman evolves with you — more ambitious, more grounded, and ready for the version of you that's just around the corner.",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL SYNTHESIS PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export async function runFullSynthesis(params: {
  userId: number;
  userName: string;
  evidenceList: TraitEvidenceInput[];
  selfReportedTraits: Partial<TraitVector>;
  desiredTraits: Partial<TraitVector>;
  mode: string;
  predictionAccuracy: number;
}): Promise<SynthesisResult> {
  const { userName, evidenceList, selfReportedTraits, desiredTraits, mode, predictionAccuracy } = params;

  // Step 1: Compute user trait vector
  const userTraits = computeUserTraitVector(evidenceList);

  // Step 2: Compute friction vector
  const frictionVector = computeFrictionVector(userTraits, desiredTraits);

  // Step 3: Compute contradiction vector
  const contradictionVector = computeContradictionVector(selfReportedTraits, userTraits, userTraits);

  // Step 4: Compute confidence vector
  const confidenceVector = computeConfidenceVector(
    userTraits,
    evidenceList,
    predictionAccuracy,
    contradictionVector
  );

  // Step 5: Compute needs vector
  const modeWeights = getModeWeights(mode);
  const needsVector = computeNeedsVector(desiredTraits, frictionVector, modeWeights);

  // Step 6: Synthesize Wingman trait vector
  const wingmanTraits = synthesizeWingmanTraitVector(userTraits, needsVector, frictionVector, desiredTraits);

  // Step 7: Compute chemistry score
  const chemistryScore = computeChemistryScore(userTraits, wingmanTraits, frictionVector);

  // Step 8: Compute overall confidence
  const overallConfidence = Object.values(confidenceVector).reduce((a, b) => a + b, 0) / TRAIT_CODES.length;

  // Step 9: Generate Wingman identity via LLM
  const identity = await generateWingmanIdentity(userTraits, wingmanTraits, chemistryScore, userName, mode);

  // Step 10: Generate prediction magic moments
  const predictionMagicMoments = PREDICTION_MAGIC_TEMPLATES.slice(0, 3);

  return {
    wingmanTraitVector: wingmanTraits,
    chemistryScore,
    overallConfidence,
    explanation: identity.explanation,
    name: identity.name,
    tagline: identity.tagline,
    catchphrase: identity.catchphrase,
    aboutMe: identity.aboutMe,
    avatarPrompt: identity.avatarPrompt,
    voiceProfile: identity.voiceProfile,
    originCardCopy: identity.originCardCopy,
    whyWeMatchedCopy: identity.whyWeMatchedCopy,
    futureYouMode: identity.futureYouMode,
    predictionMagicMoments,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONSHIP MODE WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

function getModeWeights(mode: string): Partial<TraitVector> {
  const modes: Record<string, Partial<TraitVector>> = {
    best_friend: {
      WARMTH: 85, HUMOR: 80, LOYALTY: 90, EMOTIONAL_AWARENESS: 80,
      TRUST: 85, RELIABILITY: 80, SOCIAL_ENERGY: 75,
    },
    social_coordinator: {
      INITIATIVE: 90, SOCIAL_ENERGY: 85, RELIABILITY: 85,
      STRUCTURED_VS_FLEXIBLE: 75, COMMUNICATION_STYLE: 80,
    },
    dating_support: {
      WARMTH: 80, EMOTIONAL_AWARENESS: 85, DIRECTNESS: 75,
      CONFIDENCE: 80, VULNERABILITY: 70, TRUST: 85,
    },
    business_networking: {
      DIRECTNESS: 85, INITIATIVE: 85, RELIABILITY: 90,
      AMBITION: 80, COMMUNICATION_STYLE: 85, FORMALITY: 70,
    },
    family_coordinator: {
      RELIABILITY: 90, PATIENCE: 85, WARMTH: 80,
      CONFLICT_RESOLUTION: 85, EMOTIONAL_AWARENESS: 80,
    },
  };
  return modes[mode] ?? modes.best_friend;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE NEXT INTERVIEW QUESTION
// ═══════════════════════════════════════════════════════════════════════════════

export function getNextQuestion(
  askedIds: string[],
  confidenceVector: Partial<ConfidenceVector>,
  questionCount: number
): InterviewQuestion | null {
  // Find traits with lowest confidence
  const lowConfidenceTraits = Object.entries(confidenceVector)
    .filter(([, c]) => (c ?? 0) < 0.75)
    .map(([t]) => t as TraitCode);

  // Find questions not yet asked that probe low-confidence traits
  const candidates = INTERVIEW_QUESTIONS.filter(q =>
    !askedIds.includes(q.id) &&
    q.layer <= Math.min(4, Math.floor(questionCount / 3) + 1) &&
    (lowConfidenceTraits.length === 0 || q.traitSignals.some(t => lowConfidenceTraits.includes(t)))
  );

  if (candidates.length === 0) return null;

  // Prioritize by importance and layer
  candidates.sort((a, b) => b.importance - a.importance);
  return candidates[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOULD TRIGGER PREDICTION MAGIC MOMENT?
// ═══════════════════════════════════════════════════════════════════════════════

export function shouldTriggerPredictionMoment(questionCount: number, lastTrigger: number): boolean {
  return questionCount >= 5 && (questionCount - lastTrigger) >= 5;
}
