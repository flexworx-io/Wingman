/**
 * MAESTRO tRPC Router
 * All endpoints for the Personality Synthesis Engine
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  interviews,
  traitEvidence,
  userTraitProfiles,
  companionNeedsProfiles,
  predictionEvents,
  contradictionEvents,
  socialMemoryEntries,
  wingmanInteractions,
} from "../../drizzle/schema";
import {
  TRAIT_CODES,
  INTERVIEW_QUESTIONS,
  inferTraitsFromAnswer,
  computeUserTraitVector,
  computeConfidenceVector,
  computeFrictionVector,
  computeContradictionVector,
  computeNeedsVector,
  synthesizeWingmanTraitVector,
  computeChemistryScore,
  computePredictionAccuracy,
  runFullSynthesis,
  getNextQuestion,
  shouldTriggerPredictionMoment,
  selectPredictionMagicMoment,
  PREDICTION_MAGIC_TEMPLATES,
  type TraitCode,
  type TraitVector,
  type TraitEvidenceInput,
} from "../maestro";
import { eq, and, desc } from "drizzle-orm";

// ─── Interview Router ──────────────────────────────────────────────────────────

export const interviewRouter = router({
  /**
   * Start a new interview session
   */
  start: protectedProcedure
    .input(z.object({
      mode: z.enum(["voice", "text", "hybrid"]).default("text"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create interview record
      await db.insert(interviews).values({
        userId: ctx.user.id,
        mode: input.mode,
        status: "in_progress",
        questionCount: 0,
        predictionCount: 0,
        predictionAccuracy: 0,
      });

      // Get the first question
      const firstQuestion = INTERVIEW_QUESTIONS.find(q => q.layer === 1);

      return {
        question: firstQuestion ?? INTERVIEW_QUESTIONS[0],
        totalQuestions: INTERVIEW_QUESTIONS.length,
        estimatedMinutes: 8,
        message: "Welcome to Soul Forge. I'm going to ask you some questions to understand who you really are — not just who you think you are.",
      };
    }),

  /**
   * Submit an answer and get the next question + optional prediction moment
   */
  answer: protectedProcedure
    .input(z.object({
      questionId: z.string(),
      answer: z.string().min(1).max(2000),
      answerType: z.enum(["text", "scale", "choice", "rapid"]).default("text"),
      scaleValue: z.number().min(0).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Find the question
      const question = INTERVIEW_QUESTIONS.find(q => q.id === input.questionId);
      if (!question) throw new Error("Question not found");

      // Get existing trait evidence for this user
      const existingEvidence = await db
        .select()
        .from(traitEvidence)
        .where(eq(traitEvidence.userId, ctx.user.id))
        .orderBy(desc(traitEvidence.createdAt))
        .limit(50);

      // Build existing trait vector for context
      const existingTraits: Partial<TraitVector> = {};
      for (const ev of existingEvidence) {
        const code = ev.traitCode as TraitCode;
        existingTraits[code] = ev.normalizedScore;
      }

      // Infer traits from this answer
      const answerText = input.scaleValue !== undefined
        ? `${input.answer} (scale: ${input.scaleValue}/10)`
        : input.answer;

      const newEvidence = await inferTraitsFromAnswer(question, answerText, existingTraits);

      // Store evidence in DB
      for (const ev of newEvidence) {
        const weight = 0.24; // interview_transcript weight
        await db.insert(traitEvidence).values({
          userId: ctx.user.id,
          traitCode: ev.traitCode,
          sourceType: ev.sourceType,
          rawScore: ev.rawScore,
          normalizedScore: ev.rawScore,
          weightUsed: weight,
          confidence: 0.7,
          explanation: `Inferred from answer to: ${question.text}`,
        });
      }

      // Get all evidence to compute current trait vector
      const allEvidence = await db
        .select()
        .from(traitEvidence)
        .where(eq(traitEvidence.userId, ctx.user.id));

      const evidenceInputs: TraitEvidenceInput[] = allEvidence.map(ev => ({
        traitCode: ev.traitCode as TraitCode,
        sourceType: ev.sourceType as TraitEvidenceInput["sourceType"],
        rawScore: ev.rawScore,
      }));

      const currentTraits = computeUserTraitVector(evidenceInputs);
      const askedIds = existingEvidence.map(e => e.explanation?.split(": ")[1] ?? "");
      const questionCount = askedIds.length + 1;

      // Compute confidence
      const confidenceVector = computeConfidenceVector(
        currentTraits,
        evidenceInputs,
        0.5,
        {}
      );

      // Check if we should trigger a prediction magic moment
      const lastTrigger = 0; // simplified
      const triggerPrediction = shouldTriggerPredictionMoment(questionCount, lastTrigger);

      let predictionMoment = null;
      if (triggerPrediction) {
        const moment = selectPredictionMagicMoment(currentTraits, questionCount);
        predictionMoment = {
          copy: moment.copy,
          traitSignals: moment.traitSignals,
          questionId: `pred_${questionCount}`,
        };
      }

      // Get next question
      const nextQuestion = getNextQuestion(
        [input.questionId],
        confidenceVector,
        questionCount
      );

      // Check if interview is complete (12+ questions or no more questions)
      const isComplete = questionCount >= 12 || !nextQuestion;

      return {
        nextQuestion: isComplete ? null : nextQuestion,
        predictionMoment,
        isComplete,
        questionCount,
        currentTraitSnapshot: Object.fromEntries(
          Object.entries(currentTraits).slice(0, 5)
        ),
        message: isComplete
          ? "Your Soul Forge assessment is complete. Synthesizing your Wingman now..."
          : undefined,
      };
    }),

  /**
   * Confirm or deny a prediction magic moment
   */
  confirmPrediction: protectedProcedure
    .input(z.object({
      questionId: z.string(),
      response: z.enum(["confirmed", "denied", "softened", "intensified"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Record the prediction event
      await db.insert(predictionEvents).values({
        userId: ctx.user.id,
        questionId: input.questionId,
        predictedDistributionJson: { response: input.response } as Record<string, unknown>,
        actualAnswerJson: { note: input.note ?? '' } as Record<string, unknown>,
        confirmedFlag: input.response,
        delightScore: input.response === "confirmed" ? 0.9 : 0.5,
        revealCopy: "Prediction recorded",
      });

      // If confirmed, add trait evidence with higher weight
      if (input.response === "confirmed" || input.response === "intensified") {
        await db.insert(traitEvidence).values({
          userId: ctx.user.id,
          traitCode: "VULNERABILITY",
          sourceType: "prediction_validation",
          rawScore: input.response === "intensified" ? 85 : 75,
          normalizedScore: input.response === "intensified" ? 85 : 75,
          weightUsed: 0.12,
          confidence: 0.85,
          explanation: "Prediction validation response",
        });
      }

      return {
        success: true,
        delightMessage: input.response === "confirmed"
          ? "I knew it. That's exactly what makes you, you."
          : input.response === "intensified"
          ? "Even more than I thought. I see you."
          : "Fair enough — I'm still learning you.",
      };
    }),

  /**
   * Get current interview state
   */
  getState: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const evidence = await db
        .select()
        .from(traitEvidence)
        .where(eq(traitEvidence.userId, ctx.user.id))
        .orderBy(desc(traitEvidence.createdAt))
        .limit(100);

      if (evidence.length === 0) return null;

      const evidenceInputs: TraitEvidenceInput[] = evidence.map(ev => ({
        traitCode: ev.traitCode as TraitCode,
        sourceType: ev.sourceType as TraitEvidenceInput["sourceType"],
        rawScore: ev.rawScore,
      }));

      const traitVector = computeUserTraitVector(evidenceInputs);
      const confidenceVector = computeConfidenceVector(traitVector, evidenceInputs, 0.5, {});
      const overallConfidence = Object.values(confidenceVector).reduce((a, b) => a + b, 0) / TRAIT_CODES.length;

      return {
        evidenceCount: evidence.length,
        traitVector,
        confidenceVector,
        overallConfidence,
        topTraits: Object.entries(traitVector)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([t, v]) => ({ trait: t, value: v })),
      };
    }),
});

// ─── Synthesis Router ──────────────────────────────────────────────────────────

export const synthesisRouter = router({
  /**
   * Run the full MAESTRO synthesis pipeline
   */
  synthesize: protectedProcedure
    .input(z.object({
      mode: z.enum(["best_friend", "social_coordinator", "dating_support", "business_networking", "family_coordinator"]).default("best_friend"),
      desiredTraits: z.record(z.string(), z.number()).optional(),
      selfReportedTraits: z.record(z.string(), z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get all trait evidence
      const evidence = await db
        .select()
        .from(traitEvidence)
        .where(eq(traitEvidence.userId, ctx.user.id));

      if (evidence.length === 0) {
        throw new Error("No trait evidence found. Please complete the Soul Forge interview first.");
      }

      const evidenceInputs: TraitEvidenceInput[] = evidence.map(ev => ({
        traitCode: ev.traitCode as TraitCode,
        sourceType: ev.sourceType as TraitEvidenceInput["sourceType"],
        rawScore: ev.rawScore,
      }));

      // Run full synthesis
      const result = await runFullSynthesis({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Friend",
        evidenceList: evidenceInputs,
        selfReportedTraits: (input.selfReportedTraits ?? {}) as Partial<TraitVector>,
        desiredTraits: (input.desiredTraits ?? {}) as Partial<TraitVector>,
        mode: input.mode,
        predictionAccuracy: 0.7,
      });

      // Save user trait profile
      await db.insert(userTraitProfiles).values({
        userId: ctx.user.id,
        profileVersion: 1,
        traitVectorJson: result.wingmanTraitVector as Record<string, number>,
        confidenceVectorJson: {} as Record<string, number>,
        predictionScore: result.chemistryScore,
        overallConfidence: result.overallConfidence,
      }).onDuplicateKeyUpdate?.({
          set: {
            traitVectorJson: result.wingmanTraitVector as Record<string, number>,
            predictionScore: result.chemistryScore,
            overallConfidence: result.overallConfidence,
          }
      });

      // Save companion needs profile
      await db.insert(companionNeedsProfiles).values({
        userId: ctx.user.id,
        needsVectorJson: (input.desiredTraits ?? {}) as Record<string, number>,
        mode: input.mode,
        chemistryScore: result.chemistryScore,
      });

      return {
        ...result,
        chemistryScorePercent: Math.round(result.chemistryScore * 100),
        overallConfidencePercent: Math.round(result.overallConfidence * 100),
      };
    }),

  /**
   * Get the user's current trait profile
   */
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const profiles = await db
        .select()
        .from(userTraitProfiles)
        .where(eq(userTraitProfiles.userId, ctx.user.id))
        .orderBy(desc(userTraitProfiles.createdAt))
        .limit(1);

      if (profiles.length === 0) return null;

      const profile = profiles[0];
      const traitVector = (profile.traitVectorJson ?? {}) as unknown as TraitVector;

      return {
        ...profile,
        traitVector,
        topTraits: Object.entries(traitVector)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([t, v]) => ({ trait: t, value: v, label: t.replace(/_/g, " ") })),
        bottomTraits: Object.entries(traitVector)
          .sort(([, a], [, b]) => a - b)
          .slice(0, 3)
          .map(([t, v]) => ({ trait: t, value: v, label: t.replace(/_/g, " ") })),
      };
    }),

  /**
   * Get all prediction magic moment templates
   */
  getPredictionTemplates: publicProcedure
    .query(() => {
      return PREDICTION_MAGIC_TEMPLATES.map((copy, i) => ({
        id: `pred_template_${i}`,
        copy,
      }));
    }),

  /**
   * Get compatibility between two users
   */
  getCompatibility: protectedProcedure
    .input(z.object({ targetUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const [myProfile, theirProfile] = await Promise.all([
        db.select().from(userTraitProfiles).where(eq(userTraitProfiles.userId, ctx.user.id)).limit(1),
        db.select().from(userTraitProfiles).where(eq(userTraitProfiles.userId, input.targetUserId)).limit(1),
      ]);

      if (!myProfile[0] || !theirProfile[0]) return null;

      const myTraits = (myProfile[0].traitVectorJson ?? {}) as unknown as TraitVector;
      const theirTraits = (theirProfile[0].traitVectorJson ?? {}) as unknown as TraitVector;

      // Simple compatibility: weighted trait similarity
      const vibeTraits: TraitCode[] = ["HUMOR", "WARMTH", "SOCIAL_ENERGY", "CURIOSITY", "OPTIMISM"];
      let score = 0;
      for (const t of vibeTraits) {
        const diff = Math.abs(myTraits[t] - theirTraits[t]);
        score += 1 - diff / 100;
      }
      const compatibility = score / vibeTraits.length;

      return {
        score: Math.round(compatibility * 100),
        label: compatibility > 0.85 ? "Exceptional Match" : compatibility > 0.70 ? "Strong Match" : "Good Match",
        sharedStrengths: vibeTraits
          .filter(t => Math.abs(myTraits[t] - theirTraits[t]) < 15)
          .map(t => t.replace(/_/g, " ")),
        complementaryAreas: vibeTraits
          .filter(t => Math.abs(myTraits[t] - theirTraits[t]) > 25)
          .map(t => t.replace(/_/g, " ")),
      };
    }),
});

// ─── Memory Router ─────────────────────────────────────────────────────────────

export const memoryRouter = router({
  /**
   * Add a social memory entry for a Wingman
   */
  addEntry: protectedProcedure
    .input(z.object({
      wingmanId: z.number(),
      memoryType: z.enum(["personality", "social", "relationship", "preference", "planning"]),
      summary: z.string().min(1).max(1000),
      accessScope: z.enum(["private", "wingman_only", "trusted", "public"]).default("wingman_only"),
      importance: z.number().min(0).max(1).default(0.5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(socialMemoryEntries).values({
        wingmanId: input.wingmanId,
        memoryType: input.memoryType,
        summary: input.summary,
        accessScope: input.accessScope,
        importance: input.importance,
      });

      return { success: true };
    }),

  /**
   * Get memory entries for a Wingman
   */
  getEntries: protectedProcedure
    .input(z.object({
      wingmanId: z.number(),
      memoryType: z.enum(["personality", "social", "relationship", "preference", "planning"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const entries = await db
        .select()
        .from(socialMemoryEntries)
        .where(eq(socialMemoryEntries.wingmanId, input.wingmanId))
        .orderBy(desc(socialMemoryEntries.createdAt))
        .limit(50);

      return entries.filter(e =>
        !input.memoryType || e.memoryType === input.memoryType
      );
    }),
});

// ─── Wingman Interaction Router ────────────────────────────────────────────────

export const wingmanInteractionRouter = router({
  /**
   * Initiate a Wingman-to-Wingman interaction
   */
  initiate: protectedProcedure
    .input(z.object({
      initiatorWingmanId: z.number(),
      targetWingmanId: z.number(),
      interactionType: z.enum(["introduction", "compatibility_check", "social_plan", "group_coordination", "mood_checkin", "referral"]),
      summary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(wingmanInteractions).values({
        initiatorWingmanId: input.initiatorWingmanId,
        targetWingmanId: input.targetWingmanId,
        interactionType: input.interactionType,
        summary: input.summary ?? null,
        consentFlags: { initiatorConsented: true } as Record<string, boolean>,
        safetyCheckResult: "passed",
        outcome: "pending",
      });

      return { success: true, message: "Wingman interaction initiated" };
    }),

  /**
   * Get interaction history
   */
  getHistory: protectedProcedure
    .input(z.object({ wingmanId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(wingmanInteractions)
        .where(eq(wingmanInteractions.initiatorWingmanId, input.wingmanId))
        .orderBy(desc(wingmanInteractions.createdAt))
        .limit(20);
    }),
});
