import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  float,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  location: varchar("location", { length: 200 }),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  userType: mysqlEnum("userType", ["teen", "adult"]).default("adult").notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(0).notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium", "enterprise"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── WINGMAN PROFILES ─────────────────────────────────────────────────────────
export const wingmanProfiles = mysqlTable("wingman_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  wingmanName: varchar("wingmanName", { length: 100 }).notNull(),
  tagline: text("tagline"),
  aboutMe: text("aboutMe"),
  catchphrase: text("catchphrase"),
  avatarUrl: text("avatarUrl"),
  avatarStyle: mysqlEnum("avatarStyle", ["cartoon", "realistic", "fantasy", "aspirational"]).default("realistic"),
  avatarAesthetic: varchar("avatarAesthetic", { length: 100 }),
  voiceId: varchar("voiceId", { length: 50 }),
  personalityArchetype: varchar("personalityArchetype", { length: 100 }),
  signatureStrength: varchar("signatureStrength", { length: 100 }),
  signatureStrengthScore: int("signatureStrengthScore").default(50),
  socialMode: json("socialMode").$type<string[]>().notNull(), // ['friendship','dating','business','family']
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
  trustLevel: int("trustLevel").default(1),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "bronze", "silver", "gold", "platinum"]).default("unverified"),
  murphHseId: varchar("murphHseId", { length: 200 }),
  isOnline: boolean("isOnline").default(false),
  lastActiveAt: timestamp("lastActiveAt"),
  totalConnections: int("totalConnections").default(0),
  totalIntroductions: int("totalIntroductions").default(0),
  avgCompatibilityScore: float("avgCompatibilityScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WingmanProfile = typeof wingmanProfiles.$inferSelect;
export type InsertWingmanProfile = typeof wingmanProfiles.$inferInsert;

// ─── PERSONALITY TRAITS (34 traits) ──────────────────────────────────────────
export const personalityTraits = mysqlTable("personality_traits", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  // Core Personality (5)
  openness: int("openness").default(50),
  conscientiousness: int("conscientiousness").default(50),
  extraversion: int("extraversion").default(50),
  agreeableness: int("agreeableness").default(50),
  emotionalDepth: int("emotionalDepth").default(50),
  // Thinking Style (4)
  socialEnergy: int("socialEnergy").default(50),
  practicalVsImaginative: int("practicalVsImaginative").default(50),
  headVsHeart: int("headVsHeart").default(50),
  structuredVsFlexible: int("structuredVsFlexible").default(50),
  // Inner Drive (3)
  motivationStyle: int("motivationStyle").default(50),
  growthMindset: int("growthMindset").default(50),
  purposeFocus: int("purposeFocus").default(50),
  // Social Awareness (6)
  honestyOpenness: int("honestyOpenness").default(50),
  emotionalAwareness: int("emotionalAwareness").default(50),
  socialConfidence: int("socialConfidence").default(50),
  flexibility: int("flexibility").default(50),
  reliability: int("reliability").default(50),
  curiosity: int("curiosity").default(50),
  // Communication Style (4)
  formality: int("formality").default(50),
  directness: int("directness").default(50),
  humor: int("humor").default(50),
  warmth: int("warmth").default(50),
  // Planning & Action (5)
  responseSpeed: int("responseSpeed").default(50),
  adventurousness: int("adventurousness").default(50),
  researchMindset: int("researchMindset").default(50),
  intuition: int("intuition").default(50),
  teamwork: int("teamwork").default(50),
  // Character Strengths (7)
  initiative: int("initiative").default(50),
  imagination: int("imagination").default(50),
  attentionToDetail: int("attentionToDetail").default(50),
  resilience: int("resilience").default(50),
  adaptability: int("adaptability").default(50),
  independence: int("independence").default(50),
  trust: int("trust").default(50),
  // Meta
  generatedDescription: text("generatedDescription"),
  selectedStyles: json("selectedStyles").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalityTraits = typeof personalityTraits.$inferSelect;
export type InsertPersonalityTraits = typeof personalityTraits.$inferInsert;

// ─── USER INTERESTS ───────────────────────────────────────────────────────────
export const userInterests = mysqlTable("user_interests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  interest: varchar("interest", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── TRUST LEVELS ─────────────────────────────────────────────────────────────
export const trustLevels = mysqlTable("trust_levels", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  targetWingmanId: int("targetWingmanId").notNull(),
  level: mysqlEnum("level", ["public", "acquaintance", "connection", "trusted", "inner_circle"]).default("public").notNull(),
  levelNum: int("levelNum").default(1).notNull(),
  sharedInfo: json("sharedInfo").$type<Record<string, boolean>>(),
  initiatedAt: timestamp("initiatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── CONNECTIONS ──────────────────────────────────────────────────────────────
export const connections = mysqlTable("connections", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  connectedWingmanId: int("connectedWingmanId").notNull(),
  compatibilityScore: float("compatibilityScore").default(0),
  status: mysqlEnum("status", ["pending", "active", "paused", "blocked"]).default("pending").notNull(),
  introducedAt: timestamp("introducedAt").defaultNow().notNull(),
  humanMeetingAt: timestamp("humanMeetingAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
export const activityFeed = mysqlTable("activity_feed", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── VIRTUAL SPACES ───────────────────────────────────────────────────────────
export const virtualSpaces = mysqlTable("virtual_spaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  socialMode: mysqlEnum("socialMode", ["friendship", "dating", "business", "family", "all"]).default("all"),
  imageUrl: text("imageUrl"),
  activeWingmen: int("activeWingmen").default(0),
  maxCapacity: int("maxCapacity").default(100),
  isActive: boolean("isActive").default(true),
  location: varchar("location", { length: 200 }),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SPACE PRESENCE ───────────────────────────────────────────────────────────
export const spacePresence = mysqlTable("space_presence", {
  id: int("id").autoincrement().primaryKey(),
  spaceId: int("spaceId").notNull(),
  wingmanId: int("wingmanId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  leftAt: timestamp("leftAt"),
});

// ─── CONVERSATIONS (W2W) ──────────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  wingmanAId: int("wingmanAId").notNull(),
  wingmanBId: int("wingmanBId").notNull(),
  murphConversationId: varchar("murphConversationId", { length: 200 }),
  status: mysqlEnum("status", ["initiating", "in_progress", "completed", "failed"]).default("initiating"),
  compatibilityScore: float("compatibilityScore"),
  summary: text("summary"),
  outcome: mysqlEnum("outcome", ["matched", "no_match", "pending", "human_intro_requested"]),
  transcript: json("transcript").$type<Array<{role: string; content: string; timestamp: string}>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── TRAVEL EVENTS ────────────────────────────────────────────────────────────
export const travelEvents = mysqlTable("travel_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  wingmanId: int("wingmanId").notNull(),
  city: varchar("city", { length: 200 }).notNull(),
  country: varchar("country", { length: 100 }),
  lat: float("lat"),
  lng: float("lng"),
  arrivalAt: timestamp("arrivalAt"),
  departureAt: timestamp("departureAt"),
  isActive: boolean("isActive").default(true),
  friendsNotified: int("friendsNotified").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CONFERENCE EVENTS ────────────────────────────────────────────────────────
export const conferenceEvents = mysqlTable("conference_events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 300 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  category: varchar("category", { length: 100 }),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CONFERENCE REGISTRATIONS ─────────────────────────────────────────────────
export const conferenceRegistrations = mysqlTable("conference_registrations", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  wingmanId: int("wingmanId").notNull(),
  userId: int("userId").notNull(),
  connectionGoals: json("connectionGoals").$type<Record<string, boolean>>(),
  scheduledMeetings: json("scheduledMeetings").$type<Array<{wingmanId: number; time: string; notes: string}>>(),
  briefingGenerated: boolean("briefingGenerated").default(false),
  briefingContent: text("briefingContent"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  isRead: boolean("isRead").default(false),
  isPush: boolean("isPush").default(false),
  isEmail: boolean("isEmail").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── NOTIFICATION PREFERENCES ─────────────────────────────────────────────────
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  newConnection: boolean("newConnection").default(true),
  introductionComplete: boolean("introductionComplete").default(true),
  compatibilityMatch: boolean("compatibilityMatch").default(true),
  travelAlert: boolean("travelAlert").default(true),
  conferenceMatch: boolean("conferenceMatch").default(true),
  weeklyDigest: boolean("weeklyDigest").default(true),
  pushEnabled: boolean("pushEnabled").default(true),
  emailEnabled: boolean("emailEnabled").default(true),
  pushToken: text("pushToken"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── DREAM BOARD ──────────────────────────────────────────────────────────────
export const dreamBoard = mysqlTable("dream_board", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  targetWingmanId: int("targetWingmanId").notNull(),
  compatibilityScore: float("compatibilityScore").default(0),
  sharedTraits: json("sharedTraits").$type<string[]>(),
  aiVisualizationUrl: text("aiVisualizationUrl"),
  status: mysqlEnum("status", ["potential", "introduced", "connected", "dismissed"]).default("potential"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── WINGMAN TV (AI Stories) ──────────────────────────────────────────────────
export const wingmanStories = mysqlTable("wingman_stories", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary"),
  storyType: varchar("storyType", { length: 100 }),
  thumbnailUrl: text("thumbnailUrl"),
  videoUrl: text("videoUrl"),
  duration: int("duration").default(0),
  isWatched: boolean("isWatched").default(false),
  relatedConnectionId: int("relatedConnectionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ADMIN LOGS ───────────────────────────────────────────────────────────────
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 200 }).notNull(),
  targetType: varchar("targetType", { length: 100 }),
  targetId: int("targetId"),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────
export const platformStats = mysqlTable("platform_stats", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 20 }).notNull().unique(),
  totalUsers: int("totalUsers").default(0),
  activeWingmen: int("activeWingmen").default(0),
  totalConnections: int("totalConnections").default(0),
  totalIntroductions: int("totalIntroductions").default(0),
  avgCompatibilityScore: float("avgCompatibilityScore").default(0),
  newRegistrations: int("newRegistrations").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
