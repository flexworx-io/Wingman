import { eq, desc, and, or, ne, sql, like, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, InsertUser, User,
  wingmanProfiles, InsertWingmanProfile, WingmanProfile,
  personalityTraits, InsertPersonalityTraits,
  userInterests,
  trustLevels,
  connections,
  activityFeed,
  virtualSpaces,
  spacePresence,
  conversations,
  travelEvents,
  conferenceEvents,
  conferenceRegistrations,
  notifications,
  notificationPreferences,
  dreamBoard,
  wingmanStories,
  adminLogs,
  platformStats,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateUser(id: number, data: Partial<User>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

// ─── WINGMAN PROFILES ─────────────────────────────────────────────────────────
export async function createWingmanProfile(data: InsertWingmanProfile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(wingmanProfiles).values(data);
  return (result[0] as any).insertId;
}

export async function getWingmanByUserId(userId: number): Promise<WingmanProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(wingmanProfiles).where(and(eq(wingmanProfiles.userId, userId), ne(wingmanProfiles.status, "archived"))).limit(1);
  return result[0] ?? null;
}

export async function getWingmanById(id: number): Promise<WingmanProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(wingmanProfiles).where(eq(wingmanProfiles.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateWingmanProfile(id: number, data: Partial<WingmanProfile>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(wingmanProfiles).set(data).where(eq(wingmanProfiles.id, id));
}

export async function getActiveWingmen(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wingmanProfiles).where(eq(wingmanProfiles.status, "active")).limit(limit).offset(offset).orderBy(desc(wingmanProfiles.lastActiveAt));
}

export async function getWingmenForDiscovery(userId: number, socialMode: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wingmanProfiles)
    .where(and(ne(wingmanProfiles.userId, userId), eq(wingmanProfiles.status, "active")))
    .limit(limit).orderBy(desc(wingmanProfiles.avgCompatibilityScore));
}

// ─── PERSONALITY TRAITS ───────────────────────────────────────────────────────
export async function savePersonalityTraits(data: InsertPersonalityTraits): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(personalityTraits).values(data);
  return (result[0] as any).insertId;
}

export async function getPersonalityTraits(wingmanId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(personalityTraits).where(eq(personalityTraits.wingmanId, wingmanId)).limit(1);
  return result[0] ?? null;
}

export async function updatePersonalityTraits(wingmanId: number, data: Partial<typeof personalityTraits.$inferSelect>) {
  const db = await getDb();
  if (!db) return;
  await db.update(personalityTraits).set(data).where(eq(personalityTraits.wingmanId, wingmanId));
}

// ─── USER INTERESTS ───────────────────────────────────────────────────────────
export async function saveUserInterests(userId: number, interests: Array<{category: string; interest: string}>) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userInterests).where(eq(userInterests.userId, userId));
  if (interests.length > 0) {
    await db.insert(userInterests).values(interests.map(i => ({ userId, ...i })));
  }
}

export async function getUserInterests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userInterests).where(eq(userInterests.userId, userId));
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
export async function addActivityFeedItem(wingmanId: number, activityType: string, title: string, description?: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityFeed).values({ wingmanId, activityType, title, description, metadata });
}

export async function getActivityFeed(wingmanId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityFeed).where(eq(activityFeed.wingmanId, wingmanId)).orderBy(desc(activityFeed.createdAt)).limit(limit);
}

export async function markActivityRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(activityFeed).set({ isRead: true }).where(eq(activityFeed.id, id));
}

// ─── CONNECTIONS ──────────────────────────────────────────────────────────────
export async function createConnection(wingmanId: number, connectedWingmanId: number, compatibilityScore: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(connections).values({ wingmanId, connectedWingmanId, compatibilityScore, status: "active" });
  return (result[0] as any).insertId;
}

export async function getConnections(wingmanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(connections)
    .where(or(eq(connections.wingmanId, wingmanId), eq(connections.connectedWingmanId, wingmanId)))
    .orderBy(desc(connections.createdAt));
}

export async function getConnectionCount(wingmanId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(connections)
    .where(and(or(eq(connections.wingmanId, wingmanId), eq(connections.connectedWingmanId, wingmanId)), eq(connections.status, "active")));
  return result[0]?.count ?? 0;
}

// ─── TRUST LEVELS ─────────────────────────────────────────────────────────────
export async function getTrustLevel(wingmanId: number, targetWingmanId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trustLevels)
    .where(and(eq(trustLevels.wingmanId, wingmanId), eq(trustLevels.targetWingmanId, targetWingmanId))).limit(1);
  return result[0] ?? null;
}

export async function upsertTrustLevel(wingmanId: number, targetWingmanId: number, level: string, levelNum: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getTrustLevel(wingmanId, targetWingmanId);
  if (existing) {
    await db.update(trustLevels).set({ level: level as any, levelNum }).where(eq(trustLevels.id, existing.id));
  } else {
    await db.insert(trustLevels).values({ wingmanId, targetWingmanId, level: level as any, levelNum });
  }
}

export async function getTrustConnections(wingmanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trustLevels).where(eq(trustLevels.wingmanId, wingmanId)).orderBy(desc(trustLevels.levelNum));
}

// ─── VIRTUAL SPACES ───────────────────────────────────────────────────────────
export async function getVirtualSpaces(socialMode?: string, category?: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(virtualSpaces.isActive, true)];
  if (socialMode && socialMode !== "all") {
    conditions.push(or(eq(virtualSpaces.socialMode, socialMode as any), eq(virtualSpaces.socialMode, "all")) as any);
  }
  if (category) conditions.push(eq(virtualSpaces.category, category));
  return db.select().from(virtualSpaces).where(and(...conditions)).limit(limit).orderBy(desc(virtualSpaces.activeWingmen));
}

export async function getVirtualSpaceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(virtualSpaces).where(eq(virtualSpaces.id, id)).limit(1);
  return result[0] ?? null;
}

export async function joinVirtualSpace(spaceId: number, wingmanId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(spacePresence).values({ spaceId, wingmanId });
  await db.update(virtualSpaces).set({ activeWingmen: sql`activeWingmen + 1` }).where(eq(virtualSpaces.id, spaceId));
}

export async function leaveVirtualSpace(spaceId: number, wingmanId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(spacePresence).set({ leftAt: new Date() }).where(and(eq(spacePresence.spaceId, spaceId), eq(spacePresence.wingmanId, wingmanId)));
  await db.update(virtualSpaces).set({ activeWingmen: sql`GREATEST(0, activeWingmen - 1)` }).where(eq(virtualSpaces.id, spaceId));
}

export async function seedVirtualSpaces() {
  const db = await getDb();
  if (!db) return;
  const count = await db.select({ count: sql<number>`count(*)` }).from(virtualSpaces);
  if ((count[0]?.count ?? 0) > 0) return;
  await db.insert(virtualSpaces).values([
    { name: "The Creative Hub", description: "Where artists, writers, and innovators connect", category: "Arts & Creativity", socialMode: "friendship" as const, activeWingmen: 12, tags: ["art","music","writing","design"] },
    { name: "Entrepreneur's Lounge", description: "Founders, investors, and builders networking", category: "Business", socialMode: "business" as const, activeWingmen: 28, tags: ["startup","investing","tech","growth"] },
    { name: "Adventure Seekers", description: "Travel lovers and outdoor enthusiasts", category: "Adventure", socialMode: "friendship" as const, activeWingmen: 19, tags: ["travel","hiking","sports","outdoors"] },
    { name: "Mindful Connections", description: "Wellness, meditation, and personal growth", category: "Wellness", socialMode: "all" as const, activeWingmen: 8, tags: ["wellness","meditation","yoga","growth"] },
    { name: "Tech Innovators", description: "AI, blockchain, and future tech discussions", category: "Technology", socialMode: "business" as const, activeWingmen: 34, tags: ["AI","blockchain","coding","innovation"] },
    { name: "Romantic Rendezvous", description: "A space for meaningful romantic connections", category: "Romance", socialMode: "dating" as const, activeWingmen: 15, tags: ["dating","romance","relationships","love"] },
    { name: "Family Builders", description: "For those exploring family and parenting", category: "Family", socialMode: "family" as const, activeWingmen: 6, tags: ["family","parenting","children","home"] },
    { name: "Music & Vibes", description: "Connect over shared musical tastes", category: "Music", socialMode: "friendship" as const, activeWingmen: 22, tags: ["music","concerts","festivals","playlists"] },
  ]);
}

// ─── CONVERSATIONS ────────────────────────────────────────────────────────────
export async function createConversation(wingmanAId: number, wingmanBId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(conversations).values({ wingmanAId, wingmanBId, status: "initiating" });
  return (result[0] as any).insertId;
}

export async function updateConversation(id: number, data: Partial<typeof conversations.$inferSelect>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

export async function getConversationsByWingman(wingmanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(or(eq(conversations.wingmanAId, wingmanId), eq(conversations.wingmanBId, wingmanId)))
    .orderBy(desc(conversations.createdAt)).limit(20);
}

// ─── DREAM BOARD ──────────────────────────────────────────────────────────────
export async function getDreamBoard(wingmanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dreamBoard).where(and(eq(dreamBoard.wingmanId, wingmanId), ne(dreamBoard.status, "dismissed"))).orderBy(desc(dreamBoard.compatibilityScore)).limit(20);
}

export async function addToDreamBoard(wingmanId: number, targetWingmanId: number, compatibilityScore: number, sharedTraits: string[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(dreamBoard).values({ wingmanId, targetWingmanId, compatibilityScore, sharedTraits, status: "potential" })
    .onDuplicateKeyUpdate({ set: { compatibilityScore, sharedTraits } });
}

export async function updateDreamBoardStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(dreamBoard).set({ status: status as any }).where(eq(dreamBoard.id, id));
}

// ─── WINGMAN STORIES (TV) ─────────────────────────────────────────────────────
export async function getWingmanStories(wingmanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wingmanStories).where(eq(wingmanStories.wingmanId, wingmanId)).orderBy(desc(wingmanStories.createdAt)).limit(10);
}

export async function createWingmanStory(data: typeof wingmanStories.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(wingmanStories).values(data);
}

export async function markStoryWatched(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(wingmanStories).set({ isWatched: true }).where(eq(wingmanStories.id, id));
}

// ─── TRAVEL ───────────────────────────────────────────────────────────────────
export async function recordTravelEvent(userId: number, wingmanId: number, city: string, country: string, lat?: number, lng?: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(travelEvents).set({ isActive: false }).where(and(eq(travelEvents.userId, userId), eq(travelEvents.isActive, true)));
  await db.insert(travelEvents).values({ userId, wingmanId, city, country, lat, lng, isActive: true });
}

export async function getActiveTravelEvent(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(travelEvents).where(and(eq(travelEvents.userId, userId), eq(travelEvents.isActive, true))).limit(1);
  return result[0] ?? null;
}

export async function getFriendsInCity(city: string, excludeUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ travelEvent: travelEvents, wingman: wingmanProfiles })
    .from(travelEvents)
    .innerJoin(wingmanProfiles, eq(travelEvents.wingmanId, wingmanProfiles.id))
    .where(and(eq(travelEvents.city, city), eq(travelEvents.isActive, true), ne(travelEvents.userId, excludeUserId)));
}

// ─── CONFERENCES ──────────────────────────────────────────────────────────────
export async function getConferences(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conferenceEvents).where(eq(conferenceEvents.isActive, true)).orderBy(desc(conferenceEvents.startDate)).limit(limit);
}

export async function registerForConference(conferenceId: number, wingmanId: number, userId: number, connectionGoals: Record<string, boolean>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(conferenceRegistrations).values({ conferenceId, wingmanId, userId, connectionGoals });
}

export async function getConferenceRegistration(conferenceId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conferenceRegistrations).where(and(eq(conferenceRegistrations.conferenceId, conferenceId), eq(conferenceRegistrations.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function updateConferenceBriefing(id: number, briefingContent: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(conferenceRegistrations).set({ briefingGenerated: true, briefingContent }).where(eq(conferenceRegistrations.id, id));
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export async function createNotification(userId: number, type: string, title: string, body: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, type, title, body, metadata });
}

export async function getNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertNotificationPreferences(userId: number, prefs: Partial<typeof notificationPreferences.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificationPreferences).values({ userId, ...prefs }).onDuplicateKeyUpdate({ set: prefs });
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export async function logAdminAction(adminId: number, action: string, targetType?: string, targetId?: number, details?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(adminLogs).values({ adminId, action, targetType, targetId, details });
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return null;
  const [userCount, wingmanCount, connectionCount, introCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(wingmanProfiles).where(eq(wingmanProfiles.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(connections).where(eq(connections.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(conversations).where(eq(conversations.status, "completed")),
  ]);
  return {
    totalUsers: userCount[0]?.count ?? 0,
    activeWingmen: wingmanCount[0]?.count ?? 0,
    totalConnections: connectionCount[0]?.count ?? 0,
    totalIntroductions: introCount[0]?.count ?? 0,
  };
}

export async function getRecentUsers(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}
