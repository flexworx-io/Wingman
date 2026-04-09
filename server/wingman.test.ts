import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  countUsers: vi.fn().mockResolvedValue(0),
  getRecentUsers: vi.fn().mockResolvedValue([]),
  getWingmanByUserId: vi.fn().mockResolvedValue(null),
  getWingmanById: vi.fn().mockResolvedValue(null),
  createWingmanProfile: vi.fn().mockResolvedValue(1),
  updateWingmanProfile: vi.fn().mockResolvedValue(undefined),
  getActiveWingmen: vi.fn().mockResolvedValue([]),
  getWingmenForDiscovery: vi.fn().mockResolvedValue([]),
  savePersonalityTraits: vi.fn().mockResolvedValue(1),
  getPersonalityTraits: vi.fn().mockResolvedValue(null),
  updatePersonalityTraits: vi.fn().mockResolvedValue(undefined),
  saveUserInterests: vi.fn().mockResolvedValue(undefined),
  getUserInterests: vi.fn().mockResolvedValue([]),
  addActivityFeedItem: vi.fn().mockResolvedValue(undefined),
  getActivityFeed: vi.fn().mockResolvedValue([]),
  markActivityRead: vi.fn().mockResolvedValue(undefined),
  createConnection: vi.fn().mockResolvedValue(1),
  getConnections: vi.fn().mockResolvedValue([]),
  getConnectionCount: vi.fn().mockResolvedValue(0),
  getTrustLevel: vi.fn().mockResolvedValue(null),
  upsertTrustLevel: vi.fn().mockResolvedValue(undefined),
  getTrustConnections: vi.fn().mockResolvedValue([]),
  getVirtualSpaces: vi.fn().mockResolvedValue([]),
  getVirtualSpaceById: vi.fn().mockResolvedValue(null),
  joinVirtualSpace: vi.fn().mockResolvedValue(undefined),
  leaveVirtualSpace: vi.fn().mockResolvedValue(undefined),
  seedVirtualSpaces: vi.fn().mockResolvedValue(undefined),
  createConversation: vi.fn().mockResolvedValue(1),
  updateConversation: vi.fn().mockResolvedValue(undefined),
  getConversationsByWingman: vi.fn().mockResolvedValue([]),
  getDreamBoard: vi.fn().mockResolvedValue([]),
  addToDreamBoard: vi.fn().mockResolvedValue(undefined),
  updateDreamBoardStatus: vi.fn().mockResolvedValue(undefined),
  getWingmanStories: vi.fn().mockResolvedValue([]),
  createWingmanStory: vi.fn().mockResolvedValue({ id: 1 }),
  markStoryWatched: vi.fn().mockResolvedValue(undefined),
  recordTravelEvent: vi.fn().mockResolvedValue({ id: 1 }),
  getActiveTravelEvent: vi.fn().mockResolvedValue(null),
  getFriendsInCity: vi.fn().mockResolvedValue([]),
  getConferences: vi.fn().mockResolvedValue([]),
  registerForConference: vi.fn().mockResolvedValue(undefined),
  getConferenceRegistration: vi.fn().mockResolvedValue(null),
  updateConferenceBriefing: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  getNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getNotificationPreferences: vi.fn().mockResolvedValue(null),
  upsertNotificationPreferences: vi.fn().mockResolvedValue(undefined),
  logAdminAction: vi.fn().mockResolvedValue(undefined),
  getPlatformStats: vi.fn().mockResolvedValue({ totalUsers: 100, totalWingmen: 80, totalConnections: 500, totalIntroductions: 200, activeToday: 25 }),
  getRecentActivity: vi.fn().mockResolvedValue([]),
}));

// ─── Mock Murph ───────────────────────────────────────────────────────────────
vi.mock("./murph", () => ({
  murphClient: {
    createHSE: vi.fn().mockResolvedValue({ id: "hse-123", status: "active" }),
    getHSE: vi.fn().mockResolvedValue({ id: "hse-123", status: "active" }),
    discoverConnections: vi.fn().mockResolvedValue([]),
    initiateIntroduction: vi.fn().mockResolvedValue({ success: true }),
    getConversationTranscript: vi.fn().mockResolvedValue({ messages: [] }),
    updateHSEPersonality: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ title: "Test Story", content: "A wonderful connection was made." }) } }],
  }),
}));

// ─── Test Context Factories ───────────────────────────────────────────────────
function createAuthContext(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@wingman.vip",
      name: "Test User",
      loginMethod: "oauth",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createAuthContext({ role: "admin", openId: "admin-user-456" });
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("auth.me returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@wingman.vip");
  });

  it("auth.logout clears session cookie", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Wingman Tests ────────────────────────────────────────────────────────────
describe("wingman", () => {
  it("wingman.getMyWingman returns null when no wingman exists", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.wingman.getMyWingman();
    expect(result).toBeNull();
  });

  it("wingman.createWingman creates a new wingman", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.wingman.createWingman({
      wingmanName: "Atlas",
      tagline: "Connecting souls across the universe",
      avatarStyle: "cartoon",
      socialMode: ["friendship"],
    });
    expect(result).toBeDefined();
    expect(result.wingmanId).toBe(1);
  });

  it("wingman.getActivityFeed returns empty array initially", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.wingman.getActivityFeed({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.getStats returns stats for admin user", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.getStats();
    expect(result).toBeDefined();
    expect(typeof result.totalUsers).toBe("number");
  });

  it("wingman.getStories returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.wingman.getStories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("discovery.getDreamBoard returns array (no wingman = empty)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // getDreamBoard returns [] when no wingman
    const result = await caller.discovery.getDreamBoard();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Soul Forge Tests ─────────────────────────────────────────────────────────
describe("soulForge", () => {
  // Exact 34 trait keys matching TRAIT_KEYS in routers.ts
  const validTraits = {
    openness: 75, conscientiousness: 80, extraversion: 60, agreeableness: 85,
    emotionalDepth: 70, socialEnergy: 65, practicalVsImaginative: 50,
    headVsHeart: 55, structuredVsFlexible: 60, motivationStyle: 75,
    growthMindset: 85, purposeFocus: 80, honestyOpenness: 90,
    emotionalAwareness: 75, socialConfidence: 70, flexibility: 65,
    reliability: 85, curiosity: 90, formality: 45, directness: 70,
    humor: 75, warmth: 80, responseSpeed: 70, adventurousness: 65,
    researchMindset: 80, intuition: 75, teamwork: 70, initiative: 80,
    imagination: 75, attentionToDetail: 70, resilience: 85,
    adaptability: 75, independence: 70, trust: 80,
  };

  it("soulForge.saveTraits saves personality traits", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.soulForge.saveTraits({ wingmanId: 1, traits: validTraits, selectedStyles: ["cosmic"] })
    ).resolves.toBeDefined();
  });

  it("soulForge.getTraits returns null when no traits saved", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.soulForge.getTraits({ wingmanId: 1 });
    expect(result).toBeNull();
  });
});

// ─── Interests Tests ──────────────────────────────────────────────────────────
describe("interests", () => {
  it("interests.save saves user interests", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.interests.save({
        interests: [
          { category: "technology", interest: "AI" },
          { category: "lifestyle", interest: "Travel" },
        ],
      })
    ).resolves.toBeDefined();
  });

  it("interests.get returns empty array initially", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.interests.get();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Discovery Tests ──────────────────────────────────────────────────────────
describe("discovery", () => {
  it("discovery.getSpaces returns array of spaces", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.discovery.getSpaces({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("discovery.getMatches returns array of matches", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.discovery.getMatches({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("discovery.initiateIntro throws when no wingman", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // getWingmanByUserId returns null by default, so this should throw
    await expect(
      caller.discovery.initiateIntro({ targetWingmanId: 2 })
    ).rejects.toThrow();
  });
});// ─── Connections Tests (via wingman router) ───────────────────────────────────────────
describe("connections", () => {
  it("wingman.getConnections returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.wingman.getConnections();
    expect(Array.isArray(result)).toBe(true);
  });
});/// ─── Trust Tests ────────────────────────────────────────────────────────────
describe("trust", () => {
  it("trust.getMyTrustConnections returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.trust.getMyTrustConnections();
    expect(Array.isArray(result)).toBe(true);
  });

  it("trust.updateTrustLevel requires wingman - throws without one", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // getWingmanByUserId returns null by default in mock, so this should throw
    await expect(
      caller.trust.updateTrustLevel({ targetWingmanId: 2, level: "connection" })
    ).rejects.toThrow();
  });
});;

// ─── Notifications Tests ──────────────────────────────────────────────────────
describe("notifications", () => {
  it("notifications.getAll returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.notifications.getAll({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

/// ─── Travel Tests ────────────────────────────────────────────────────────────
describe("travel", () => {
  it("travel.getActiveTravel returns null when no travel", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.travel.getActiveTravel();
    expect(result).toBeNull();
  });

  it("travel.recordTravel requires wingman - throws without one", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // getWingmanByUserId returns null by default, so this should throw
    await expect(
      caller.travel.recordTravel({ city: "New York", country: "USA" })
    ).rejects.toThrow();
  });

  it("travel.getFriendsNearby returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.travel.getFriendsNearby({ city: "New York" });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Admin Tests ──────────────────────────────────────────────────────────────
describe("admin", () => {
  it("admin.getStats requires admin role", async () => {
    const userCaller = appRouter.createCaller(createAuthContext());
    await expect(userCaller.admin.getStats()).rejects.toThrow();
  });

  it("admin.getStats returns stats for admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.getStats();
    expect(result).toBeDefined();
    expect(typeof result.totalUsers).toBe("number");
  });

  it("admin.getUsers returns object with users array for admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.getUsers({ limit: 10, offset: 0 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
  });

  it("admin.getActiveWingmen returns array for admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.getActiveWingmen({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.getRecentUsers returns array for admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.getRecentUsers();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Events Tests ────────────────────────────────────────────────────────────
describe("events", () => {
  it("events.getConferences returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.events.getConferences();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Admin logAction Test ─────────────────────────────────────────────────────
describe("admin.logAction", () => {
  it("admin.logAction logs an action", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.logAction({ action: "test_action" });
    expect(result.success).toBe(true);
  });
});
