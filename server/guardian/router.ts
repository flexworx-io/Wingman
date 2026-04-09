/**
 * Guardian Shield™ — tRPC Router
 * Covers: Trust Contacts, Risk Events, Verified Adult, Safe Meet™,
 *         Panic Mode™, Guardian Pulse™, Incidents, Content Safety
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { drizzle } from "drizzle-orm/mysql2";

async function requireDb(): Promise<ReturnType<typeof drizzle>> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}
import {
  trustContacts,
  guardianRiskEvents,
  verifiedAdultCredentials,
  meetupSessions,
  panicEvents,
  incidents,
  contentSafetyScans,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  scoreGroomingRisk,
  scoreScamRisk,
  scoreViolenceRisk,
  scoreSelfHarmRisk,
  scoreMeetupRisk,
  scoreIdentityDeceptionRisk,
  evaluateAllRisks,
  getHighestRisk,
  type RiskSignals,
} from "./riskEngine";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

// ─── TRUST CONTACTS ───────────────────────────────────────────────────────────
const trustContactsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select()
      .from(trustContacts)
      .where(and(eq(trustContacts.userId, ctx.user.id), eq(trustContacts.isActive, true)))
      .orderBy(trustContacts.priorityOrder);
  }),

  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        relationship: z.string().min(1).max(100),
        phone: z.string().max(30).optional(),
        email: z.string().email().optional(),
        priorityOrder: z.number().int().min(1).max(10).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [contact] = await db
        .insert(trustContacts)
        .values({ userId: ctx.user.id, ...input })
        .$returningId();
      return { id: contact.id, ...input };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(200).optional(),
        relationship: z.string().min(1).max(100).optional(),
        phone: z.string().max(30).optional(),
        email: z.string().email().optional(),
        priorityOrder: z.number().int().min(1).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const { id, ...data } = input;
      await db
        .update(trustContacts)
        .set(data)
        .where(and(eq(trustContacts.id, id), eq(trustContacts.userId, ctx.user.id)));
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db
        .update(trustContacts)
        .set({ isActive: false })
        .where(and(eq(trustContacts.id, input.id), eq(trustContacts.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── RISK EVALUATION ──────────────────────────────────────────────────────────
const riskRouter = router({
  // Evaluate risk from raw signals (used by internal services)
  evaluate: protectedProcedure
    .input(
      z.object({
        counterpartUserId: z.number().int().optional(),
        signals: z.record(z.string(), z.number().min(0).max(1)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const results = evaluateAllRisks(input.signals as RiskSignals);
      const highest = getHighestRisk(results);

      // Persist any elevated+ risks to the DB
      const elevated = results.filter((r) => r.score >= 0.5);
      for (const r of elevated) {
        await db.insert(guardianRiskEvents).values({
          userId: ctx.user.id,
          counterpartUserId: input.counterpartUserId,
          riskType: r.riskType,
          riskScore: r.score,
          severityBand: r.severityBand,
          evidenceSummary: r.evidenceSummary,
          interventionLevel: r.interventionLevel,
          status: "open",
        });

        // Notify platform owner on critical events
        if (r.severityBand === "critical") {
          await notifyOwner({
            title: `🚨 CRITICAL ${r.riskType.toUpperCase()} RISK — User ${ctx.user.id}`,
            content: r.recommendation,
          });
        }
      }

      return { results, highest, persistedCount: elevated.length };
    }),

  // AI-powered text analysis for risk signals
  analyzeText: protectedProcedure
    .input(
      z.object({
        text: z.string().max(5000),
        counterpartUserId: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const llmResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a child safety and fraud detection AI. Analyze the following message for risk signals. Score each signal from 0.0 to 1.0 where 0 = not present, 1 = strongly present. Only output JSON with the signal scores. Be conservative.",
          },
          {
            role: "user",
            content: `Analyze this message for safety risk signals:\n\n"${input.text.slice(0, 2000)}"`,
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
              required: ["secrecy","offPlatform","sexualization","giftEnticement","isolation","persistence","paymentAsk","urgency","extortion","threatExplicitness","selfHarmSignal","hopelessness","finality"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = llmResult.choices[0].message.content;
      const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      let signals: Partial<RiskSignals> = {};
      try { signals = JSON.parse(contentStr); } catch { signals = {}; }

      const results = evaluateAllRisks(signals as RiskSignals);
      const highest = getHighestRisk(results);

      // Persist elevated risks
      const elevated = results.filter((r) => r.score >= 0.5);
      for (const r of elevated) {
         await db.insert(guardianRiskEvents).values({
          userId: ctx.user.id,
          counterpartUserId: input.counterpartUserId,
          riskType: r.riskType,
          riskScore: r.score,
          severityBand: r.severityBand,
          evidenceSummary: r.evidenceSummary,
          interventionLevel: r.interventionLevel,
          status: "open",
        });
      }
      return { signals, results, highest };
    }),

  // Get user's risk event historyy
  myEvents: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(guardianRiskEvents)
        .where(eq(guardianRiskEvents.userId, ctx.user.id))
        .orderBy(desc(guardianRiskEvents.createdAt))
        .limit(input.limit);
    }),
});

// ─── VERIFIED ADULT SAFEACCESS™ ───────────────────────────────────────────────
const verifiedAdultRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [cred] = await db
      .select()
      .from(verifiedAdultCredentials)
      .where(eq(verifiedAdultCredentials.userId, ctx.user.id));
    return cred ?? null;
  }),

  startVerification: protectedProcedure
    .input(
      z.object({
        verificationMethod: z.enum(["government_id", "selfie_liveness", "phone_email"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Upsert credential record
      const existing = await db
        .select()
        .from(verifiedAdultCredentials)
        .where(eq(verifiedAdultCredentials.userId, ctx.user.id));

      if (existing.length === 0) {
        await db.insert(verifiedAdultCredentials).values({
          userId: ctx.user.id,
          screeningStatus: "pending",
          verificationMethod: input.verificationMethod,
        });
      } else {
        await db
          .update(verifiedAdultCredentials)
          .set({ screeningStatus: "pending", verificationMethod: input.verificationMethod })
          .where(eq(verifiedAdultCredentials.userId, ctx.user.id));
      }

      return { status: "pending", message: "Verification process initiated. Our team will review your submission." };
    }),

  completeVerification: protectedProcedure
    .input(
      z.object({
        ageVerified: z.boolean(),
        identityVerified: z.boolean(),
        livenessVerified: z.boolean(),
        interactionScope: z.enum(["adult_only", "minor_allowed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1-year credential

      await db
        .update(verifiedAdultCredentials)
        .set({
          ...input,
          screeningStatus: "approved",
          expiresAt,
        })
        .where(eq(verifiedAdultCredentials.userId, ctx.user.id));

      return { success: true, expiresAt };
    }),
});

// ─── SAFE MEET™ ───────────────────────────────────────────────────────────────
const safeMeetRouter = router({
  startMeetup: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number().int(),
        plannedLocation: z.string().max(500).optional(),
        plannedAt: z.string().datetime().optional(),
        durationEstimateMinutes: z.number().int().min(15).max(480).default(60),
        trustContactVisibility: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Compute meetup risk score
      const riskResult = scoreMeetupRisk({
        noVerification: 0.3, // default moderate — no verification assumed
        noSafetyCheckIn: input.trustContactVisibility ? 0 : 0.5,
      });

      const checkinSchedule = [
        { label: "Arrived safely", offsetMinutes: 0, completed: false },
        { label: "Mid-meeting check-in", offsetMinutes: Math.floor(input.durationEstimateMinutes / 2), completed: false },
        { label: "Leaving safely", offsetMinutes: input.durationEstimateMinutes, completed: false },
      ];

      const [session] = await db
        .insert(meetupSessions)
        .values({
          initiatingUserId: ctx.user.id,
          targetUserId: input.targetUserId,
          riskScore: riskResult.score,
          plannedLocation: input.plannedLocation,
          plannedAt: input.plannedAt ? new Date(input.plannedAt) : undefined,
          durationEstimateMinutes: input.durationEstimateMinutes,
          checkinSchedule,
          trustContactVisibility: input.trustContactVisibility,
          publicLocationRequired: true,
          panicEnabled: true,
          status: "planned",
        })
        .$returningId();

      return {
        meetupId: session.id,
        riskScore: riskResult.score,
        severityBand: riskResult.severityBand,
        checkinSchedule,
        safetyTips: [
          "Choose a public location with other people around",
          "Tell someone you trust where you're going",
          "Keep your phone charged",
          "Trust your instincts — it's OK to leave early",
          "Don't share your home address on a first meeting",
        ],
      };
    }),

  checkin: protectedProcedure
    .input(
      z.object({
        meetupId: z.number().int(),
        checkinLabel: z.string(),
        status: z.enum(["safe", "concern", "panic"]),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [session] = await db
        .select()
        .from(meetupSessions)
        .where(
          and(
            eq(meetupSessions.id, input.meetupId),
            eq(meetupSessions.initiatingUserId, ctx.user.id)
          )
        );

      if (!session) throw new Error("Meetup session not found");

      if (input.status === "panic") {
        // Trigger Panic Mode
        await db
          .update(meetupSessions)
          .set({ status: "panic_triggered", panicTriggeredAt: new Date() })
          .where(eq(meetupSessions.id, input.meetupId));

      const db2 = await requireDb();
      // Get trust contacts
      const contacts = await db2
        .select()
        .from(trustContacts)
        .where(and(eq(trustContacts.userId, ctx.user.id), eq(trustContacts.isActive, true)))
        .orderBy(trustContacts.priorityOrder);

      const contactIds = contacts.map((c) => c.id);

      await db2.insert(panicEvents).values({
          userId: ctx.user.id,
          meetupSessionId: input.meetupId,
          triggerType: "explicit_signal",
          contactsNotified: contactIds,
          status: "active",
          notes: input.notes,
        });

        await notifyOwner({
          title: `🚨 PANIC MODE ACTIVATED — User ${ctx.user.id}`,
          content: `User triggered panic during meetup session ${input.meetupId}. Trust contacts notified: ${contactIds.join(", ")}`,
        });

        return { status: "panic_triggered", contactsNotified: contacts.length };
      }

      // Update checkin schedule
      const schedule = (session.checkinSchedule as Array<{ label: string; offsetMinutes: number; completed: boolean }>) ?? [];
      const updated = schedule.map((item) =>
        item.label === input.checkinLabel ? { ...item, completed: true } : item
      );

      const allDone = updated.every((item) => item.completed);

      await db
        .update(meetupSessions)
        .set({
          checkinSchedule: updated,
          status: allDone ? "completed" : "active",
          arrivedAt: input.checkinLabel === "Arrived safely" ? new Date() : session.arrivedAt,
          completedAt: allDone ? new Date() : undefined,
        })
        .where(eq(meetupSessions.id, input.meetupId));

      return { success: true, allCheckinsComplete: allDone };
    }),

  getMySessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.initiatingUserId, ctx.user.id))
      .orderBy(desc(meetupSessions.createdAt))
      .limit(20);
  }),
});

// ─── PANIC MODE™ ──────────────────────────────────────────────────────────────
const panicRouter = router({
  activate: protectedProcedure
    .input(
      z.object({
        triggerType: z.enum(["manual", "missed_checkin", "critical_risk", "explicit_signal"]),
        locationLat: z.number().optional(),
        locationLng: z.number().optional(),
        locationAddress: z.string().max(500).optional(),
        meetupSessionId: z.number().int().optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Get trust contacts
      const contacts = await db
        .select()
        .from(trustContacts)
        .where(and(eq(trustContacts.userId, ctx.user.id), eq(trustContacts.isActive, true)))
        .orderBy(trustContacts.priorityOrder);

      const contactIds = contacts.map((c) => c.id);

      const [panic] = await db
        .insert(panicEvents)
        .values({
          userId: ctx.user.id,
          meetupSessionId: input.meetupSessionId,
          triggerType: input.triggerType,
          locationLat: input.locationLat,
          locationLng: input.locationLng,
          locationAddress: input.locationAddress,
          contactsNotified: contactIds,
          status: "active",
          notes: input.notes,
        })
        .$returningId();

      // Alert platform owner
      await notifyOwner({
        title: `🚨 PANIC MODE — User ${ctx.user.id} (${input.triggerType})`,
        content: `Location: ${input.locationAddress ?? "unknown"}. Trust contacts notified: ${contacts.map((c) => c.name).join(", ")}`,
      });

      return {
        panicId: panic.id,
        status: "active",
        contactsNotified: contacts.map((c) => ({ name: c.name, relationship: c.relationship })),
        emergencyInstructions: [
          "Stay calm and move to a safe, public location",
          "Call 911 if you are in immediate danger",
          "Your trusted contacts have been notified",
          "Keep this screen visible to show your location",
          "You can resolve this panic when you are safe",
        ],
      };
    }),

  resolve: protectedProcedure
    .input(
      z.object({
        panicId: z.number().int(),
        resolution: z.enum(["resolved", "false_alarm"]),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db
        .update(panicEvents)
        .set({
          status: input.resolution,
          resolvedAt: new Date(),
          notes: input.notes,
        })
        .where(and(eq(panicEvents.id, input.panicId), eq(panicEvents.userId, ctx.user.id)));

      return { success: true };
    }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select()
      .from(panicEvents)
      .where(and(eq(panicEvents.userId, ctx.user.id), eq(panicEvents.status, "active")))
      .orderBy(desc(panicEvents.createdAt))
      .limit(1);
  }),
});

// ─── GUARDIAN PULSE™ (parent/guardian summary) ────────────────────────────────
const guardianPulseRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    // Safety summary for the current user
    const [riskCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(guardianRiskEvents)
      .where(and(eq(guardianRiskEvents.userId, ctx.user.id), eq(guardianRiskEvents.status, "open")));

    const [panicCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(panicEvents)
      .where(and(eq(panicEvents.userId, ctx.user.id), eq(panicEvents.status, "active")));

    const recentRisks = await db
      .select()
      .from(guardianRiskEvents)
      .where(eq(guardianRiskEvents.userId, ctx.user.id))
      .orderBy(desc(guardianRiskEvents.createdAt))
      .limit(5);

    const contacts = await db
      .select()
      .from(trustContacts)
      .where(and(eq(trustContacts.userId, ctx.user.id), eq(trustContacts.isActive, true)));

    return {
      openRiskCount: Number(riskCount?.count ?? 0),
      activePanicCount: Number(panicCount?.count ?? 0),
      recentRisks,
      trustContactCount: contacts.length,
      overallSafetyStatus:
        Number(panicCount?.count ?? 0) > 0
          ? "critical"
          : Number(riskCount?.count ?? 0) > 3
          ? "elevated"
          : Number(riskCount?.count ?? 0) > 0
          ? "moderate"
          : "safe",
    };
  }),
});

// ─── INCIDENT REPORTING ───────────────────────────────────────────────────────
const incidentRouter = router({
  report: protectedProcedure
    .input(
      z.object({
        subjectUserId: z.number().int(),
        incidentType: z.enum(["grooming", "scam", "harassment", "impersonation", "csam", "violence_threat", "self_harm", "other"]),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        description: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [incident] = await db
        .insert(incidents)
        .values({
          reportedByUserId: ctx.user.id,
          ...input,
          caseStatus: "open",
        })
        .$returningId();

      // Alert owner on high/critical incidents
      if (input.severity === "high" || input.severity === "critical") {
        await notifyOwner({
          title: `⚠️ ${input.severity.toUpperCase()} INCIDENT REPORT — ${input.incidentType}`,
          content: `Reported by user ${ctx.user.id} against user ${input.subjectUserId}. ${input.description?.slice(0, 200) ?? ""}`,
        });
      }

      return { incidentId: incident.id, status: "open" };
    }),

  myReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select()
      .from(incidents)
      .where(eq(incidents.reportedByUserId, ctx.user.id))
      .orderBy(desc(incidents.createdAt))
      .limit(20);
  }),
});

// ─── CONTENT SAFETY ───────────────────────────────────────────────────────────
const contentSafetyRouter = router({
  scanText: protectedProcedure
    .input(
      z.object({
        text: z.string().max(10000),
        contentRef: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Use LLM to classify content safety
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a content safety classifier. Analyze the text for policy violations.
Return JSON with:
- safe: boolean (true if content is safe)
- categories: string[] (violated categories from: ['nudity','sexual_minor','violence','hate','harassment','self_harm','spam','scam'])
- confidence: number (0.0-1.0)
- action: 'allowed' | 'warned' | 'blocked' | 'escalated'`,
          },
          { role: "user", content: input.text.slice(0, 5000) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "content_safety",
            strict: true,
            schema: {
              type: "object",
              properties: {
                safe: { type: "boolean" },
                categories: { type: "array", items: { type: "string" } },
                confidence: { type: "number" },
                action: { type: "string" },
              },
              required: ["safe", "categories", "confidence", "action"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawMsg = result.choices[0].message.content;
      const msgStr = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
      let parsed: { safe: boolean; categories: string[]; confidence: number; action: string };
      try {
        parsed = JSON.parse(msgStr);
      } catch {
        parsed = { safe: true, categories: [], confidence: 0, action: "allowed" };
      }

      const scanResult = parsed.safe ? "safe" : parsed.categories.includes("sexual_minor") ? "blocked" : "flagged";
      const action = parsed.action as "allowed" | "warned" | "blocked" | "escalated";

      await db.insert(contentSafetyScans).values({
        userId: ctx.user.id,
        contentType: "text",
        contentRef: input.contentRef,
        scanResult,
        categories: parsed.categories,
        confidence: parsed.confidence,
        action,
      });

      // Escalate CSAM immediately
      if (parsed.categories.includes("sexual_minor")) {
        await db.insert(incidents).values({
          reportedByUserId: ctx.user.id,
          subjectUserId: ctx.user.id,
          incidentType: "csam",
          severity: "critical",
          description: "Automated content safety scan detected potential CSAM",
          caseStatus: "open",
        });
        await notifyOwner({
          title: "🚨 CRITICAL: CSAM DETECTED",
          content: `Automated scan flagged content from user ${ctx.user.id}`,
        });
      }

      return { safe: parsed.safe, categories: parsed.categories, action, confidence: parsed.confidence };
    }),
});

// ─── TRUST & SAFETY OPS CONSOLE (admin only) ─────────────────────────────────
const opsConsoleRouter = router({
  listIncidents: protectedProcedure
    .input(
      z.object({
        status: z.enum(["open", "under_review", "action_taken", "closed", "appealed"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        incidentType: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
      const db = await requireDb();

      const conditions = [];
      if (input.status) conditions.push(eq(incidents.caseStatus, input.status));
      if (input.severity) conditions.push(eq(incidents.severity, input.severity));

      const rows = await db
        .select()
        .from(incidents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(incidents.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  updateIncident: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        caseStatus: z.enum(["open", "under_review", "action_taken", "closed", "appealed"]).optional(),
        resolution: z.string().max(5000).optional(),
        assignedTo: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
      const db = await requireDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.caseStatus === "closed" || data.caseStatus === "action_taken") {
        updateData.resolvedAt = new Date();
      }
      await db.update(incidents).set(updateData).where(eq(incidents.id, id));
      return { success: true };
    }),

  listRiskEvents: protectedProcedure
    .input(
      z.object({
        severityBand: z.enum(["low", "moderate", "elevated", "high", "critical"]).optional(),
        riskType: z.enum(["grooming", "scam", "violence", "self_harm", "unsafe_meetup", "identity_deception"]).optional(),
        status: z.enum(["open", "acknowledged", "resolved", "escalated", "false_positive"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
      const db = await requireDb();

      const conditions = [];
      if (input.severityBand) conditions.push(eq(guardianRiskEvents.severityBand, input.severityBand));
      if (input.riskType) conditions.push(eq(guardianRiskEvents.riskType, input.riskType));
      if (input.status) conditions.push(eq(guardianRiskEvents.status, input.status));

      return db
        .select()
        .from(guardianRiskEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(guardianRiskEvents.createdAt))
        .limit(input.limit);
    }),

  resolveRiskEvent: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["acknowledged", "resolved", "escalated", "false_positive"]),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
      const db = await requireDb();
      await db
        .update(guardianRiskEvents)
        .set({
          status: input.status,
          notes: input.notes,
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(guardianRiskEvents.id, input.id));
      return { success: true };
    }),

  getPlatformSafetyStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
    const db = await requireDb();

    const [openIncidents] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(eq(incidents.caseStatus, "open"));

    const [criticalRisks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(guardianRiskEvents)
      .where(and(eq(guardianRiskEvents.severityBand, "critical"), eq(guardianRiskEvents.status, "open")));

    const [activePanics] = await db
      .select({ count: sql<number>`count(*)` })
      .from(panicEvents)
      .where(eq(panicEvents.status, "active"));

    const [verifiedAdults] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifiedAdultCredentials)
      .where(eq(verifiedAdultCredentials.screeningStatus, "approved"));

    return {
      openIncidents: Number(openIncidents?.count ?? 0),
      criticalRisks: Number(criticalRisks?.count ?? 0),
      activePanics: Number(activePanics?.count ?? 0),
      verifiedAdults: Number(verifiedAdults?.count ?? 0),
    };
  }),
});

// ─── MAIN GUARDIAN ROUTER ─────────────────────────────────────────────────────
export const guardianRouter = router({
  trustContacts: trustContactsRouter,
  risk: riskRouter,
  verifiedAdult: verifiedAdultRouter,
  safeMeet: safeMeetRouter,
  panic: panicRouter,
  pulse: guardianPulseRouter,
  incidents: incidentRouter,
  contentSafety: contentSafetyRouter,
  ops: opsConsoleRouter,
});
