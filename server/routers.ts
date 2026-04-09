import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import {
  upsertUser, getUserById, updateUser, getAllUsers, countUsers, getRecentUsers,
  createWingmanProfile, getWingmanByUserId, getWingmanById, updateWingmanProfile,
  getActiveWingmen, getWingmenForDiscovery,
  savePersonalityTraits, getPersonalityTraits, updatePersonalityTraits,
  saveUserInterests, getUserInterests,
  addActivityFeedItem, getActivityFeed, markActivityRead,
  createConnection, getConnections, getConnectionCount,
  getTrustLevel, upsertTrustLevel, getTrustConnections,
  getVirtualSpaces, getVirtualSpaceById, joinVirtualSpace, leaveVirtualSpace, seedVirtualSpaces,
  createConversation, updateConversation, getConversationsByWingman,
  getDreamBoard, addToDreamBoard, updateDreamBoardStatus,
  getWingmanStories, createWingmanStory, markStoryWatched,
  recordTravelEvent, getActiveTravelEvent, getFriendsInCity,
  getConferences, registerForConference, getConferenceRegistration, updateConferenceBriefing,
  createNotification, getNotifications, markNotificationRead, markAllNotificationsRead,
  getNotificationPreferences, upsertNotificationPreferences,
  logAdminAction, getPlatformStats,
} from "./db";
import {
  createHSE, updateHSE, discoverCompatibleHSEs, initiateIntroduction,
  getConversation, calculateCompatibility,
} from "./murph";

// ─── SOUL FORGE TRAIT DEFINITIONS ─────────────────────────────────────────────
const TRAIT_KEYS = [
  "openness","conscientiousness","extraversion","agreeableness","emotionalDepth",
  "socialEnergy","practicalVsImaginative","headVsHeart","structuredVsFlexible",
  "motivationStyle","growthMindset","purposeFocus",
  "honestyOpenness","emotionalAwareness","socialConfidence","flexibility","reliability","curiosity",
  "formality","directness","humor","warmth",
  "responseSpeed","adventurousness","researchMindset","intuition","teamwork",
  "initiative","imagination","attentionToDetail","resilience","adaptability","independence","trust",
] as const;

const TraitSchema = z.object(
  Object.fromEntries(TRAIT_KEYS.map(k => [k, z.number().min(0).max(100)])) as Record<typeof TRAIT_KEYS[number], z.ZodNumber>
);

// ─── AUTH ROUTER ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input);
      return { success: true };
    }),
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await updateUser(ctx.user.id, { onboardingCompleted: true });
    return { success: true };
  }),
});

// ─── SOUL FORGE ROUTER ────────────────────────────────────────────────────────
const soulForgeRouter = router({
  generateTraitDescription: protectedProcedure
    .input(z.object({ traits: TraitSchema, selectedStyles: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      const topTraits = Object.entries(input.traits)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 5)
        .map(([k]) => k);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are the Soul Forge AI, generating vivid personality descriptions for Wingman AI agents. Be creative, poetic, and insightful. Keep it to 2-3 sentences." },
          { role: "user", content: `Generate a personality description for someone with these dominant traits: ${topTraits.join(", ")}. Their style preferences: ${input.selectedStyles.join(", ")}.` },
        ],
      });
      return { description: response.choices[0]?.message?.content || "" };
    }),

  generateWingmanIdentity: protectedProcedure
    .input(z.object({
      traits: TraitSchema,
      socialModes: z.array(z.string()),
      interests: z.array(z.string()),
      avatarStyle: z.string(),
    }))
    .mutation(async ({ input }) => {
      const topTraits = Object.entries(input.traits).sort(([,a],[,b]) => b - a).slice(0, 5).map(([k]) => k);
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are the Soul Forge AI. Generate a Wingman AI agent identity. Return ONLY valid JSON." },
          { role: "user", content: `Create a Wingman identity for someone with traits: ${topTraits.join(", ")}, social modes: ${input.socialModes.join(", ")}, interests: ${input.interests.slice(0,5).join(", ")}. Return JSON with: name (creative AI agent name), tagline (short punchy tagline), aboutMe (2 sentences), catchphrase (memorable one-liner), personalityArchetype (one word), signatureStrength (one strength).` },
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
                aboutMe: { type: "string" },
                catchphrase: { type: "string" },
                personalityArchetype: { type: "string" },
                signatureStrength: { type: "string" },
              },
              required: ["name","tagline","aboutMe","catchphrase","personalityArchetype","signatureStrength"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = (response.choices[0]?.message?.content as string) || "{}";
      return JSON.parse(content);
    }),

  generateAvatar: protectedProcedure
    .input(z.object({
      style: z.enum(["cartoon","realistic","fantasy","aspirational"]),
      aesthetic: z.string(),
      personalityArchetype: z.string(),
      topTraits: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const prompt = `A ${input.style} AI avatar portrait for a social connection agent. Personality: ${input.personalityArchetype}. Aesthetic: ${input.aesthetic}. Traits: ${input.topTraits.join(", ")}. Dark background with aurora/neon lighting, premium digital art style, cinematic quality. No text.`;
      const { url } = await generateImage({ prompt });
      return { avatarUrl: url };
    }),

  saveTraits: protectedProcedure
    .input(z.object({
      wingmanId: z.number(),
      traits: TraitSchema,
      selectedStyles: z.array(z.string()),
      generatedDescription: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await getPersonalityTraits(input.wingmanId);
      if (existing) {
        await updatePersonalityTraits(input.wingmanId, {
          ...input.traits,
          selectedStyles: input.selectedStyles,
          generatedDescription: input.generatedDescription,
        });
      } else {
        await savePersonalityTraits({
          wingmanId: input.wingmanId,
          ...input.traits,
          selectedStyles: input.selectedStyles,
          generatedDescription: input.generatedDescription,
        });
      }
      return { success: true };
    }),

  getTraits: protectedProcedure
    .input(z.object({ wingmanId: z.number() }))
    .query(async ({ input }) => {
      return getPersonalityTraits(input.wingmanId);
    }),
});

// ─── WINGMAN ROUTER ───────────────────────────────────────────────────────────
const wingmanRouter = router({
  getMyWingman: protectedProcedure.query(async ({ ctx }) => {
    const wingman = await getWingmanByUserId(ctx.user.id);
    return wingman ?? null;
  }),

  createWingman: protectedProcedure
    .input(z.object({
      wingmanName: z.string().min(1).max(100),
      tagline: z.string().optional(),
      aboutMe: z.string().optional(),
      catchphrase: z.string().optional(),
      avatarUrl: z.string().optional(),
      avatarStyle: z.enum(["cartoon","realistic","fantasy","aspirational"]).optional(),
      avatarAesthetic: z.string().optional(),
      personalityArchetype: z.string().optional(),
      signatureStrength: z.string().optional(),
      socialMode: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getWingmanByUserId(ctx.user.id);
      if (existing) {
        await updateWingmanProfile(existing.id, { ...input, status: "draft" });
        return { wingmanId: existing.id };
      }
      const wingmanId = await createWingmanProfile({
        userId: ctx.user.id,
        ...input,
        status: "draft",
      });
      return { wingmanId };
    }),

  activateWingman: protectedProcedure
    .input(z.object({ wingmanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanById(input.wingmanId);
      if (!wingman || wingman.userId !== ctx.user.id) throw new Error("Unauthorized");

      // Create HSE in Murph.AI
      const traits = await getPersonalityTraits(input.wingmanId);
      const interests = await getUserInterests(ctx.user.id);
      let murphHseId = wingman.murphHseId;

      if (!murphHseId && traits) {
        const hse = await createHSE({
          name: wingman.wingmanName,
          personality: Object.fromEntries(
            Object.entries(traits).filter(([k,v]) => typeof v === "number" && k !== "id" && k !== "wingmanId")
          ) as Record<string, number>,
          socialModes: wingman.socialMode as string[],
          interests: interests.map(i => i.interest),
          tagline: wingman.tagline || undefined,
          catchphrase: wingman.catchphrase || undefined,
        });
        murphHseId = hse.id;
      }

      await updateWingmanProfile(input.wingmanId, {
        status: "active",
        murphHseId: murphHseId || undefined,
        lastActiveAt: new Date(),
        isOnline: true,
      });
      await updateUser(ctx.user.id, { onboardingCompleted: true });
      await addActivityFeedItem(input.wingmanId, "activation", "Wingman Activated!", "Your Wingman is now live and ready to make connections.");

      return { success: true, murphHseId };
    }),

  updateWingman: protectedProcedure
    .input(z.object({
      wingmanId: z.number(),
      data: z.object({
        wingmanName: z.string().optional(),
        tagline: z.string().optional(),
        aboutMe: z.string().optional(),
        catchphrase: z.string().optional(),
        avatarUrl: z.string().optional(),
        socialMode: z.array(z.string()).optional(),
        status: z.enum(["draft","active","paused","archived"]).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanById(input.wingmanId);
      if (!wingman || wingman.userId !== ctx.user.id) throw new Error("Unauthorized");
      await updateWingmanProfile(input.wingmanId, input.data);
      if (wingman.murphHseId) {
        await updateHSE(wingman.murphHseId, { name: input.data.wingmanName });
      }
      return { success: true };
    }),

  getActivityFeed: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) return [];
      return getActivityFeed(wingman.id, input.limit);
    }),

  markActivityRead: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .mutation(async ({ input }) => {
      await markActivityRead(input.activityId);
      return { success: true };
    }),

  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const wingman = await getWingmanByUserId(ctx.user.id);
    if (!wingman) return [];
    const conns = await getConnections(wingman.id);
    const enriched = await Promise.all(conns.map(async (c) => {
      const otherId = c.wingmanId === wingman.id ? c.connectedWingmanId : c.wingmanId;
      const other = await getWingmanById(otherId);
      return { ...c, otherWingman: other };
    }));
    return enriched;
  }),

  getStories: protectedProcedure.query(async ({ ctx }) => {
    const wingman = await getWingmanByUserId(ctx.user.id);
    if (!wingman) return [];
    return getWingmanStories(wingman.id);
  }),

  markStoryWatched: protectedProcedure
    .input(z.object({ storyId: z.number() }))
    .mutation(async ({ input }) => {
      await markStoryWatched(input.storyId);
      return { success: true };
    }),

  generateStory: protectedProcedure
    .input(z.object({ connectionId: z.number().optional() }))
    .mutation(async ({ ctx }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) throw new Error("No wingman found");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are Wingman TV, generating exciting short story summaries about AI social connections. Be cinematic and engaging." },
          { role: "user", content: `Generate a Wingman TV story for ${wingman.wingmanName} (${wingman.personalityArchetype || "social"} archetype). Create a title and 2-sentence summary of a recent connection adventure. Return JSON with title and summary.` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "story",
            strict: true,
            schema: {
              type: "object",
              properties: { title: { type: "string" }, summary: { type: "string" } },
              required: ["title","summary"],
              additionalProperties: false,
            },
          },
        },
      });
      const { title, summary } = JSON.parse((response.choices[0]?.message?.content as string) || "{}");
      await createWingmanStory({ wingmanId: wingman.id, title, summary, storyType: "connection_adventure" });
      return { success: true };
    }),
});

// ─── DISCOVERY ROUTER ─────────────────────────────────────────────────────────
const discoveryRouter = router({
  getSpaces: publicProcedure
    .input(z.object({
      socialMode: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      await seedVirtualSpaces();
      return getVirtualSpaces(input.socialMode, input.category, input.limit);
    }),

  joinSpace: protectedProcedure
    .input(z.object({ spaceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) throw new Error("No wingman found");
      await joinVirtualSpace(input.spaceId, wingman.id);
      await addActivityFeedItem(wingman.id, "space_join", "Entered a Virtual Space", `Your Wingman joined a new virtual space.`);
      return { success: true };
    }),

  leaveSpace: protectedProcedure
    .input(z.object({ spaceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) throw new Error("No wingman found");
      await leaveVirtualSpace(input.spaceId, wingman.id);
      return { success: true };
    }),

  getMatches: protectedProcedure
    .input(z.object({ socialMode: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) return [];
      if (wingman.murphHseId) {
        const murphMatches = await discoverCompatibleHSEs(wingman.murphHseId, {
          socialMode: input.socialMode,
          limit: input.limit,
        });
        const enriched = await Promise.all(murphMatches.map(async (m) => {
          const matchWingman = await getWingmanByUserId(0); // placeholder
          return { ...m, wingman: matchWingman };
        }));
        return enriched;
      }
      return getWingmenForDiscovery(ctx.user.id, input.socialMode || "all", input.limit);
    }),

  initiateIntro: protectedProcedure
    .input(z.object({ targetWingmanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const myWingman = await getWingmanByUserId(ctx.user.id);
      const targetWingman = await getWingmanById(input.targetWingmanId);
      if (!myWingman || !targetWingman) throw new Error("Wingman not found");

      const convId = await createConversation(myWingman.id, targetWingman.id);

      let murphConvId: string | undefined;
      if (myWingman.murphHseId && targetWingman.murphHseId) {
        const murphConv = await initiateIntroduction(myWingman.murphHseId, targetWingman.murphHseId);
        murphConvId = murphConv.id;
        await updateConversation(convId, { murphConversationId: murphConvId, status: "in_progress" });
      }

      await addActivityFeedItem(myWingman.id, "introduction", `Introduction Initiated`, `Your Wingman is introducing itself to ${targetWingman.wingmanName}.`);

      return { conversationId: convId, murphConversationId: murphConvId };
    }),

  getDreamBoard: protectedProcedure.query(async ({ ctx }) => {
    const wingman = await getWingmanByUserId(ctx.user.id);
    if (!wingman) return [];
    const board = await getDreamBoard(wingman.id);
    const enriched = await Promise.all(board.map(async (item) => {
      const target = await getWingmanById(item.targetWingmanId);
      return { ...item, targetWingman: target };
    }));
    return enriched;
  }),

  dismissDreamBoardItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input }) => {
      await updateDreamBoardStatus(input.itemId, "dismissed");
      return { success: true };
    }),

  getCompatibility: protectedProcedure
    .input(z.object({ targetWingmanId: z.number() }))
    .query(async ({ ctx, input }) => {
      const myWingman = await getWingmanByUserId(ctx.user.id);
      const targetWingman = await getWingmanById(input.targetWingmanId);
      if (!myWingman || !targetWingman) return null;
      if (myWingman.murphHseId && targetWingman.murphHseId) {
        return calculateCompatibility(myWingman.murphHseId, targetWingman.murphHseId);
      }
      return { score: 0.75, breakdown: {}, sharedTraits: [] };
    }),
});

// ─── TRUST ROUTER ─────────────────────────────────────────────────────────────
const trustRouter = router({
  getMyTrustConnections: protectedProcedure.query(async ({ ctx }) => {
    const wingman = await getWingmanByUserId(ctx.user.id);
    if (!wingman) return [];
    const levels = await getTrustConnections(wingman.id);
    const enriched = await Promise.all(levels.map(async (l) => {
      const target = await getWingmanById(l.targetWingmanId);
      return { ...l, targetWingman: target };
    }));
    return enriched;
  }),

  updateTrustLevel: protectedProcedure
    .input(z.object({
      targetWingmanId: z.number(),
      level: z.enum(["public","acquaintance","connection","trusted","inner_circle"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) throw new Error("No wingman");
      const levelMap = { public: 1, acquaintance: 2, connection: 3, trusted: 4, inner_circle: 5 };
      await upsertTrustLevel(wingman.id, input.targetWingmanId, input.level, levelMap[input.level]);
      await addActivityFeedItem(wingman.id, "trust_update", "Trust Level Updated", `Trust level with a connection updated to ${input.level.replace("_"," ")}.`);
      return { success: true };
    }),

  getTrustLevel: protectedProcedure
    .input(z.object({ targetWingmanId: z.number() }))
    .query(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) return null;
      return getTrustLevel(wingman.id, input.targetWingmanId);
    }),
});

// ─── TRAVEL ROUTER ────────────────────────────────────────────────────────────
const travelRouter = router({
  recordTravel: protectedProcedure
    .input(z.object({
      city: z.string(),
      country: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) throw new Error("No wingman");
      await recordTravelEvent(ctx.user.id, wingman.id, input.city, input.country || "", input.lat, input.lng);
      const friends = await getFriendsInCity(input.city, ctx.user.id);
      if (friends.length > 0) {
        await addActivityFeedItem(wingman.id, "travel_alert", `Friends in ${input.city}!`, `${friends.length} connection${friends.length > 1 ? "s" : ""} detected nearby.`);
        await createNotification(ctx.user.id, "travel_alert", `Friends in ${input.city}!`, `Your Wingman detected ${friends.length} connection${friends.length > 1 ? "s" : ""} in ${input.city}.`);
      }
      return { success: true, friendsFound: friends.length };
    }),

  getActiveTravel: protectedProcedure.query(async ({ ctx }) => {
    return getActiveTravelEvent(ctx.user.id);
  }),

  getFriendsNearby: protectedProcedure
    .input(z.object({ city: z.string() }))
    .query(async ({ ctx, input }) => {
      return getFriendsInCity(input.city, ctx.user.id);
    }),
});

// ─── EVENTS ROUTER ────────────────────────────────────────────────────────────
const eventsRouter = router({
  getConferences: publicProcedure.query(async () => {
    return getConferences();
  }),

  registerForConference: protectedProcedure
    .input(z.object({
      conferenceId: z.number(),
      connectionGoals: z.record(z.string(), z.boolean()),
    }))
    .mutation(async ({ ctx, input }) => {
      const wingman = await getWingmanByUserId(ctx.user.id);
      if (!wingman) throw new Error("No wingman");
      await registerForConference(input.conferenceId, wingman.id, ctx.user.id, input.connectionGoals as Record<string, boolean>);
      await addActivityFeedItem(wingman.id, "conference_register", "Conference Registration", "Your Wingman registered for an event and will begin matching.");
      return { success: true };
    }),

  getConferenceBriefing: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const reg = await getConferenceRegistration(input.conferenceId, ctx.user.id);
      if (!reg) return null;
      if (!reg.briefingGenerated) {
        const wingman = await getWingmanByUserId(ctx.user.id);
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are Wingman AI generating a personalized conference briefing. Be specific and actionable." },
            { role: "user", content: `Generate a conference briefing for ${wingman?.wingmanName || "the user"} attending a conference. Goals: ${JSON.stringify(reg.connectionGoals)}. Include: key networking strategies, conversation starters, and 3 specific connection opportunities.` },
          ],
        });
        const briefing = (response.choices[0]?.message?.content as string) || "";
        await updateConferenceBriefing(reg.id, briefing);
        return { ...reg, briefingContent: briefing, briefingGenerated: true };
      }
      return reg;
    }),
});

// ─── NOTIFICATIONS ROUTER ─────────────────────────────────────────────────────
const notificationsRouter = router({
  getAll: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return getNotifications(ctx.user.id, input.limit);
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.notificationId);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return getNotificationPreferences(ctx.user.id);
  }),

  updatePreferences: protectedProcedure
    .input(z.object({
      newConnection: z.boolean().optional(),
      introductionComplete: z.boolean().optional(),
      compatibilityMatch: z.boolean().optional(),
      travelAlert: z.boolean().optional(),
      conferenceMatch: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      pushToken: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertNotificationPreferences(ctx.user.id, input);
      return { success: true };
    }),
});

// ─── ADMIN ROUTER ─────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new Error("Forbidden: Admin only");
  return next({ ctx });
});

const adminRouter = router({
  getStats: adminProcedure.query(async () => {
    return getPlatformStats();
  }),

  getUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const [users, total] = await Promise.all([
        getAllUsers(input.limit, input.offset),
        countUsers(),
      ]);
      return { users, total };
    }),

  getRecentUsers: adminProcedure.query(async () => {
    return getRecentUsers(10);
  }),

  getActiveWingmen: adminProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return getActiveWingmen(input.limit);
    }),

  logAction: adminProcedure
    .input(z.object({
      action: z.string(),
      targetType: z.string().optional(),
      targetId: z.number().optional(),
      details: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await logAdminAction(ctx.user.id, input.action, input.targetType, input.targetId, input.details as Record<string, unknown> | undefined);
      return { success: true };
    }),
});

// ─── INTERESTS ROUTER ─────────────────────────────────────────────────────────
const interestsRouter = router({
  save: protectedProcedure
    .input(z.object({
      interests: z.array(z.object({ category: z.string(), interest: z.string() })),
    }))
    .mutation(async ({ ctx, input }) => {
      await saveUserInterests(ctx.user.id, input.interests);
      return { success: true };
    }),

  get: protectedProcedure.query(async ({ ctx }) => {
    return getUserInterests(ctx.user.id);
  }),
});

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  soulForge: soulForgeRouter,
  wingman: wingmanRouter,
  discovery: discoveryRouter,
  trust: trustRouter,
  travel: travelRouter,
  events: eventsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  interests: interestsRouter,
});

export type AppRouter = typeof appRouter;
