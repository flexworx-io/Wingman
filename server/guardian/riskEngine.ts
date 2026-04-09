/**
 * Guardian Shield™ — Risk Scoring Engine
 * Implements all 6 risk models from the spec with exact weighted formulas.
 */

export type RiskType = "grooming" | "scam" | "violence" | "self_harm" | "unsafe_meetup" | "identity_deception";
export type SeverityBand = "low" | "moderate" | "elevated" | "high" | "critical";
export type InterventionLevel = 1 | 2 | 3 | 4;

export interface RiskSignals {
  // Grooming signals
  secrecy?: number;          // 0–1: requests for secrecy
  offPlatform?: number;      // 0–1: attempts to move off-platform
  sexualization?: number;    // 0–1: sexualized language with minors
  giftEnticement?: number;   // 0–1: gifts/rides/money/emotional dependency
  isolation?: number;        // 0–1: attempts to isolate from guardians
  persistence?: number;      // 0–1: persistent pressure despite refusal
  ageMismatch?: number;      // 0–1: significant age gap indicators
  boundaryPush?: number;     // 0–1: boundary violations

  // Scam signals
  paymentAsk?: number;       // 0–1: payment/crypto/gift-card requests
  urgency?: number;          // 0–1: urgency/fear manipulation
  identityMismatch?: number; // 0–1: identity inconsistency
  deviceAnomaly?: number;    // 0–1: device/account anomalies
  romancePattern?: number;   // 0–1: romance scam patterns
  extortion?: number;        // 0–1: extortion/sextortion signals
  offPlatformMove?: number;  // 0–1: off-platform migration

  // Violence signals
  threatExplicitness?: number; // 0–1: explicit threats
  intent?: number;             // 0–1: clear harmful intent
  targetSpecificity?: number;  // 0–1: specific target mentioned
  escalation?: number;         // 0–1: escalating pattern
  history?: number;            // 0–1: prior incident history
  planningSignals?: number;    // 0–1: planning language

  // Self-harm signals
  selfHarmSignal?: number;   // 0–1: self-harm ideation
  planSignal?: number;       // 0–1: planning markers
  hopelessness?: number;     // 0–1: hopelessness language
  meansAccess?: number;      // 0–1: means discussion
  finality?: number;         // 0–1: goodbye/finality language
  panic?: number;            // 0–1: panic/trapped cues
  environmentDanger?: number; // 0–1: environmental danger

  // Unsafe meetup signals
  identityWeakness?: number;   // 0–1: unverified identity
  noVerification?: number;     // 0–1: lack of verification
  offPlatformPlan?: number;    // 0–1: off-platform planning
  privateLocation?: number;    // 0–1: private/secluded location
  noSafetyCheckIn?: number;    // 0–1: no trust-contact visibility
  timeRisk?: number;           // 0–1: late-night/isolated timing
  priorRisk?: number;          // 0–1: prior elevated risk signals

  // Identity deception signals
  documentMismatch?: number;   // 0–1: document inconsistency
  livenessAnomaly?: number;    // 0–1: liveness check anomaly
  voiceFaceMismatch?: number;  // 0–1: voice/face inconsistency
  networkFarmSignal?: number;  // 0–1: account-farm patterns
  profileInconsistency?: number; // 0–1: profile metadata inconsistency
  bioContradictions?: number;  // 0–1: biographical contradictions
}

export interface RiskResult {
  riskType: RiskType;
  score: number;
  severityBand: SeverityBand;
  interventionLevel: InterventionLevel;
  evidenceSummary: Record<string, number>;
  recommendation: string;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function getSeverityBand(score: number): SeverityBand {
  if (score < 0.25) return "low";
  if (score < 0.50) return "moderate";
  if (score < 0.75) return "elevated";
  if (score < 0.90) return "high";
  return "critical";
}

function getInterventionLevel(band: SeverityBand): InterventionLevel {
  switch (band) {
    case "low": return 1;
    case "moderate": return 1;
    case "elevated": return 2;
    case "high": return 3;
    case "critical": return 4;
  }
}

function getRecommendation(riskType: RiskType, band: SeverityBand): string {
  const actions: Record<SeverityBand, string> = {
    low: "Continue monitoring. No immediate action required.",
    moderate: "Issue safety nudge. Increase monitoring frequency.",
    elevated: "Apply protective friction. Block risky media exchange. Log for guardian awareness.",
    high: "Freeze risky interaction. Alert trust systems. Create safety case.",
    critical: "Hard disengage. Trigger incident creation. Escalate to guardian/emergency contacts immediately.",
  };
  return `[${riskType.toUpperCase()}] ${actions[band]}`;
}

// ─── GROOMING RISK ENGINE™ ────────────────────────────────────────────────────
// GroomingRisk = 0.18*Secrecy + 0.15*OffPlatform + 0.20*Sexualization +
//               0.10*GiftEnticement + 0.12*Isolation + 0.10*Persistence +
//               0.10*AgeMismatch + 0.05*BoundaryPush
export function scoreGroomingRisk(signals: RiskSignals): RiskResult {
  const s = signals;
  const score = clamp(
    0.18 * (s.secrecy ?? 0) +
    0.15 * (s.offPlatform ?? 0) +
    0.20 * (s.sexualization ?? 0) +
    0.10 * (s.giftEnticement ?? 0) +
    0.12 * (s.isolation ?? 0) +
    0.10 * (s.persistence ?? 0) +
    0.10 * (s.ageMismatch ?? 0) +
    0.05 * (s.boundaryPush ?? 0)
  );
  const band = getSeverityBand(score);
  return {
    riskType: "grooming",
    score: Math.round(score * 1000) / 1000,
    severityBand: band,
    interventionLevel: getInterventionLevel(band),
    evidenceSummary: {
      secrecy: s.secrecy ?? 0,
      offPlatform: s.offPlatform ?? 0,
      sexualization: s.sexualization ?? 0,
      giftEnticement: s.giftEnticement ?? 0,
      isolation: s.isolation ?? 0,
      persistence: s.persistence ?? 0,
      ageMismatch: s.ageMismatch ?? 0,
      boundaryPush: s.boundaryPush ?? 0,
    },
    recommendation: getRecommendation("grooming", band),
  };
}

// ─── SCAMSHIELD™ ──────────────────────────────────────────────────────────────
// ScamRisk = 0.20*PaymentAsk + 0.15*Urgency + 0.15*IdentityMismatch +
//            0.12*DeviceAnomaly + 0.13*RomancePattern + 0.15*Extortion +
//            0.10*OffPlatformMove
export function scoreScamRisk(signals: RiskSignals): RiskResult {
  const s = signals;
  const score = clamp(
    0.20 * (s.paymentAsk ?? 0) +
    0.15 * (s.urgency ?? 0) +
    0.15 * (s.identityMismatch ?? 0) +
    0.12 * (s.deviceAnomaly ?? 0) +
    0.13 * (s.romancePattern ?? 0) +
    0.15 * (s.extortion ?? 0) +
    0.10 * (s.offPlatformMove ?? 0)
  );
  const band = getSeverityBand(score);
  return {
    riskType: "scam",
    score: Math.round(score * 1000) / 1000,
    severityBand: band,
    interventionLevel: getInterventionLevel(band),
    evidenceSummary: {
      paymentAsk: s.paymentAsk ?? 0,
      urgency: s.urgency ?? 0,
      identityMismatch: s.identityMismatch ?? 0,
      deviceAnomaly: s.deviceAnomaly ?? 0,
      romancePattern: s.romancePattern ?? 0,
      extortion: s.extortion ?? 0,
      offPlatformMove: s.offPlatformMove ?? 0,
    },
    recommendation: getRecommendation("scam", band),
  };
}

// ─── VIOLENCE / THREAT RISK ───────────────────────────────────────────────────
// ViolenceRisk = 0.25*ThreatExplicitness + 0.20*Intent + 0.20*TargetSpecificity +
//               0.15*Escalation + 0.10*History + 0.10*PlanningSignals
export function scoreViolenceRisk(signals: RiskSignals): RiskResult {
  const s = signals;
  const score = clamp(
    0.25 * (s.threatExplicitness ?? 0) +
    0.20 * (s.intent ?? 0) +
    0.20 * (s.targetSpecificity ?? 0) +
    0.15 * (s.escalation ?? 0) +
    0.10 * (s.history ?? 0) +
    0.10 * (s.planningSignals ?? 0)
  );
  const band = getSeverityBand(score);
  return {
    riskType: "violence",
    score: Math.round(score * 1000) / 1000,
    severityBand: band,
    interventionLevel: getInterventionLevel(band),
    evidenceSummary: {
      threatExplicitness: s.threatExplicitness ?? 0,
      intent: s.intent ?? 0,
      targetSpecificity: s.targetSpecificity ?? 0,
      escalation: s.escalation ?? 0,
      history: s.history ?? 0,
      planningSignals: s.planningSignals ?? 0,
    },
    recommendation: getRecommendation("violence", band),
  };
}

// ─── SELF-HARM / LIFE THREAT RISK ─────────────────────────────────────────────
// LifeThreatRisk = 0.20*SelfHarmSignal + 0.20*PlanSignal + 0.15*Hopelessness +
//                 0.15*MeansAccess + 0.10*Finality + 0.10*Panic + 0.10*EnvironmentDanger
export function scoreSelfHarmRisk(signals: RiskSignals): RiskResult {
  const s = signals;
  const score = clamp(
    0.20 * (s.selfHarmSignal ?? 0) +
    0.20 * (s.planSignal ?? 0) +
    0.15 * (s.hopelessness ?? 0) +
    0.15 * (s.meansAccess ?? 0) +
    0.10 * (s.finality ?? 0) +
    0.10 * (s.panic ?? 0) +
    0.10 * (s.environmentDanger ?? 0)
  );
  const band = getSeverityBand(score);
  return {
    riskType: "self_harm",
    score: Math.round(score * 1000) / 1000,
    severityBand: band,
    interventionLevel: getInterventionLevel(band),
    evidenceSummary: {
      selfHarmSignal: s.selfHarmSignal ?? 0,
      planSignal: s.planSignal ?? 0,
      hopelessness: s.hopelessness ?? 0,
      meansAccess: s.meansAccess ?? 0,
      finality: s.finality ?? 0,
      panic: s.panic ?? 0,
      environmentDanger: s.environmentDanger ?? 0,
    },
    recommendation: getRecommendation("self_harm", band),
  };
}

// ─── UNSAFE MEETUP RISK ───────────────────────────────────────────────────────
// MeetupRisk = 0.20*IdentityWeakness + 0.15*NoVerification + 0.15*OffPlatformPlan +
//              0.15*PrivateLocation + 0.10*NoSafetyCheckIn + 0.10*TimeRisk + 0.15*PriorRisk
export function scoreMeetupRisk(signals: RiskSignals): RiskResult {
  const s = signals;
  const score = clamp(
    0.20 * (s.identityWeakness ?? 0) +
    0.15 * (s.noVerification ?? 0) +
    0.15 * (s.offPlatformPlan ?? 0) +
    0.15 * (s.privateLocation ?? 0) +
    0.10 * (s.noSafetyCheckIn ?? 0) +
    0.10 * (s.timeRisk ?? 0) +
    0.15 * (s.priorRisk ?? 0)
  );
  const band = getSeverityBand(score);
  return {
    riskType: "unsafe_meetup",
    score: Math.round(score * 1000) / 1000,
    severityBand: band,
    interventionLevel: getInterventionLevel(band),
    evidenceSummary: {
      identityWeakness: s.identityWeakness ?? 0,
      noVerification: s.noVerification ?? 0,
      offPlatformPlan: s.offPlatformPlan ?? 0,
      privateLocation: s.privateLocation ?? 0,
      noSafetyCheckIn: s.noSafetyCheckIn ?? 0,
      timeRisk: s.timeRisk ?? 0,
      priorRisk: s.priorRisk ?? 0,
    },
    recommendation: getRecommendation("unsafe_meetup", band),
  };
}

// ─── IDENTITY DECEPTION RISK ──────────────────────────────────────────────────
// IdentityDeceptionRisk = 0.20*DocumentMismatch + 0.20*LivenessAnomaly +
//                         0.15*VoiceFaceMismatch + 0.15*NetworkFarmSignal +
//                         0.15*ProfileInconsistency + 0.15*BioContradictions
export function scoreIdentityDeceptionRisk(signals: RiskSignals): RiskResult {
  const s = signals;
  const score = clamp(
    0.20 * (s.documentMismatch ?? 0) +
    0.20 * (s.livenessAnomaly ?? 0) +
    0.15 * (s.voiceFaceMismatch ?? 0) +
    0.15 * (s.networkFarmSignal ?? 0) +
    0.15 * (s.profileInconsistency ?? 0) +
    0.15 * (s.bioContradictions ?? 0)
  );
  const band = getSeverityBand(score);
  return {
    riskType: "identity_deception",
    score: Math.round(score * 1000) / 1000,
    severityBand: band,
    interventionLevel: getInterventionLevel(band),
    evidenceSummary: {
      documentMismatch: s.documentMismatch ?? 0,
      livenessAnomaly: s.livenessAnomaly ?? 0,
      voiceFaceMismatch: s.voiceFaceMismatch ?? 0,
      networkFarmSignal: s.networkFarmSignal ?? 0,
      profileInconsistency: s.profileInconsistency ?? 0,
      bioContradictions: s.bioContradictions ?? 0,
    },
    recommendation: getRecommendation("identity_deception", band),
  };
}

// ─── COMPOSITE RISK EVALUATOR ─────────────────────────────────────────────────
export function evaluateAllRisks(signals: RiskSignals): RiskResult[] {
  return [
    scoreGroomingRisk(signals),
    scoreScamRisk(signals),
    scoreViolenceRisk(signals),
    scoreSelfHarmRisk(signals),
    scoreMeetupRisk(signals),
    scoreIdentityDeceptionRisk(signals),
  ];
}

export function getHighestRisk(results: RiskResult[]): RiskResult | null {
  if (results.length === 0) return null;
  return results.reduce((max, r) => r.score > max.score ? r : max, results[0]);
}

// ─── AI-ASSISTED RISK SIGNAL EXTRACTION ───────────────────────────────────────
// Uses LLM to extract risk signals from conversation text
export async function extractRiskSignalsFromText(
  text: string,
  invokeLLM: (params: { messages: Array<{ role: string; content: string }>; response_format: unknown }) => Promise<{ choices: Array<{ message: { content: string } }> }>
): Promise<Partial<RiskSignals>> {
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a child safety and fraud detection AI. Analyze the following message for risk signals.
Score each signal from 0.0 to 1.0 where 0 = not present, 1 = strongly present.
Only output JSON with the signal scores. Be conservative — only flag clear indicators.`,
      },
      {
        role: "user",
        content: `Analyze this message for safety risk signals:\n\n"${text.slice(0, 2000)}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "risk_signals",
        strict: true,
        schema: {
          type: "object",
          properties: {
            secrecy: { type: "number" },
            offPlatform: { type: "number" },
            sexualization: { type: "number" },
            giftEnticement: { type: "number" },
            isolation: { type: "number" },
            persistence: { type: "number" },
            paymentAsk: { type: "number" },
            urgency: { type: "number" },
            extortion: { type: "number" },
            threatExplicitness: { type: "number" },
            selfHarmSignal: { type: "number" },
            hopelessness: { type: "number" },
            finality: { type: "number" },
          },
          required: [
            "secrecy", "offPlatform", "sexualization", "giftEnticement",
            "isolation", "persistence", "paymentAsk", "urgency", "extortion",
            "threatExplicitness", "selfHarmSignal", "hopelessness", "finality",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    return JSON.parse(result.choices[0].message.content) as Partial<RiskSignals>;
  } catch {
    return {};
  }
}
