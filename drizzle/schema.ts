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
  // Multi-tenant
  orgId: int("orgId"),
  // Full auth
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  authProvider: mysqlEnum("authProvider", ["email", "google", "microsoft", "manus"]).default("manus").notNull(),
  isSuperAdmin: boolean("isSuperAdmin").default(false).notNull(),
  suspendedAt: timestamp("suspendedAt"),
  suspendReason: text("suspendReason"),
  // Stripe billing
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAESTRO PERSONALITY SYNTHESIS ENGINE TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
export const interviews = mysqlTable("interviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mode: mysqlEnum("mode", ["voice", "text", "hybrid"]).default("text").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  transcript: text("transcript"),
  audioUri: varchar("audioUri", { length: 500 }),
  semanticFeaturesJson: json("semanticFeaturesJson").$type<Record<string, unknown>>(),
  voiceFeaturesJson: json("voiceFeaturesJson").$type<Record<string, unknown>>(),
  questionCount: int("questionCount").default(0),
  predictionCount: int("predictionCount").default(0),
  predictionAccuracy: float("predictionAccuracy").default(0),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// ─── TRAIT EVIDENCE ───────────────────────────────────────────────────────────
export const traitEvidence = mysqlTable("trait_evidence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  interviewId: int("interviewId"),
  traitCode: varchar("traitCode", { length: 100 }).notNull(),
  sourceType: mysqlEnum("sourceType", [
    "interview_transcript",
    "voice_tone",
    "rapid_preference",
    "scenario_response",
    "direct_preference",
    "prediction_validation",
    "contradiction_followup"
  ]).notNull(),
  rawScore: float("rawScore").notNull(),
  normalizedScore: float("normalizedScore").notNull(),
  weightUsed: float("weightUsed").notNull(),
  confidence: float("confidence").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── USER TRAIT PROFILES ──────────────────────────────────────────────────────
export const userTraitProfiles = mysqlTable("user_trait_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileVersion: int("profileVersion").default(1).notNull(),
  traitVectorJson: json("traitVectorJson").$type<Record<string, number>>().notNull(),
  confidenceVectorJson: json("confidenceVectorJson").$type<Record<string, number>>().notNull(),
  predictionScore: float("predictionScore").default(0),
  contradictionVectorJson: json("contradictionVectorJson").$type<Record<string, number>>(),
  frictionVectorJson: json("frictionVectorJson").$type<Record<string, number>>(),
  overallConfidence: float("overallConfidence").default(0),
  certifiedAt: timestamp("certifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── COMPANION NEEDS PROFILES ─────────────────────────────────────────────────
export const companionNeedsProfiles = mysqlTable("companion_needs_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  needsVectorJson: json("needsVectorJson").$type<Record<string, number>>().notNull(),
  mode: mysqlEnum("mode", ["best_friend", "social_coordinator", "dating_support", "business_networking", "family_coordinator"]).default("best_friend").notNull(),
  rationale: json("rationale").$type<Record<string, string>>(),
  chemistryScore: float("chemistryScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PREDICTION EVENTS ────────────────────────────────────────────────────────
export const predictionEvents = mysqlTable("prediction_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  interviewId: int("interviewId"),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  predictedDistributionJson: json("predictedDistributionJson").$type<Record<string, unknown>>().notNull(),
  actualAnswerJson: json("actualAnswerJson").$type<Record<string, unknown>>(),
  accuracyScore: float("accuracyScore"),
  revealCopy: text("revealCopy").notNull(),
  confirmedFlag: mysqlEnum("confirmedFlag", ["pending", "confirmed", "denied", "softened", "intensified"]).default("pending").notNull(),
  delightScore: float("delightScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CONTRADICTION EVENTS ─────────────────────────────────────────────────────
export const contradictionEvents = mysqlTable("contradiction_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  interviewId: int("interviewId"),
  traitCode: varchar("traitCode", { length: 100 }).notNull(),
  selfValue: float("selfValue"),
  observedValue: float("observedValue"),
  predictedValue: float("predictedValue"),
  contradictionScore: float("contradictionScore").notNull(),
  insightType: mysqlEnum("insightType", ["aspirational_identity", "self_deception", "hidden_pain", "context_dependent", "blind_spot"]).default("context_dependent").notNull(),
  resolutionStatus: mysqlEnum("resolutionStatus", ["pending", "resolved", "accepted", "dismissed"]).default("pending").notNull(),
  resolutionNote: text("resolutionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SOCIAL MEMORY ENTRIES ────────────────────────────────────────────────────
export const socialMemoryEntries = mysqlTable("social_memory_entries", {
  id: int("id").autoincrement().primaryKey(),
  wingmanId: int("wingmanId").notNull(),
  memoryType: mysqlEnum("memoryType", ["personality", "social", "relationship", "preference", "planning"]).notNull(),
  summary: text("summary").notNull(),
  retrievalEmbeddingRef: varchar("retrievalEmbeddingRef", { length: 500 }),
  accessScope: mysqlEnum("accessScope", ["private", "wingman_only", "trusted", "public"]).default("wingman_only").notNull(),
  importance: float("importance").default(0.5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── WINGMAN INTERACTIONS ─────────────────────────────────────────────────────
export const wingmanInteractions = mysqlTable("wingman_interactions", {
  id: int("id").autoincrement().primaryKey(),
  initiatorWingmanId: int("initiatorWingmanId").notNull(),
  targetWingmanId: int("targetWingmanId").notNull(),
  interactionType: mysqlEnum("interactionType", ["introduction", "compatibility_check", "social_plan", "group_coordination", "mood_checkin", "referral"]).notNull(),
  summary: text("summary"),
  consentFlags: json("consentFlags").$type<Record<string, boolean>>(),
  safetyCheckResult: mysqlEnum("safetyCheckResult", ["passed", "flagged", "blocked"]).default("passed").notNull(),
  chemistryScore: float("chemistryScore"),
  outcome: mysqlEnum("outcome", ["pending", "accepted", "declined", "completed", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-TENANT + FULL AUTH TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ORGANIZATIONS (TENANTS) ──────────────────────────────────────────────────
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  plan: mysqlEnum("plan", ["free", "starter", "professional", "enterprise"]).default("free").notNull(),
  maxUsers: int("maxUsers").default(10).notNull(),
  config: json("config").$type<Record<string, unknown>>(),
  ownerId: int("ownerId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── EMAIL VERIFICATIONS ──────────────────────────────────────────────────────
export const emailVerifications = mysqlTable("email_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── OAUTH ACCOUNTS ───────────────────────────────────────────────────────────
export const oauthAccounts = mysqlTable("oauth_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["google", "microsoft", "manus"]).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PASSWORD RESETS ──────────────────────────────────────────────────────────
export const passwordResets = mysqlTable("password_resets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ORG INVITATIONS ──────────────────────────────────────────────────────────
export const orgInvitations = mysqlTable("org_invitations", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrgInvitation = typeof orgInvitations.$inferSelect;

// ─── GUARDIAN SHIELD™ TABLES ──────────────────────────────────────────────────

// Trust Contacts — people the user trusts for safety escalation
export const trustContacts = mysqlTable("trust_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(), // 'parent','sibling','friend','guardian'
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  priorityOrder: int("priorityOrder").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrustContact = typeof trustContacts.$inferSelect;
export type InsertTrustContact = typeof trustContacts.$inferInsert;

// Guardian Risk Events — logged risk signals with scoring
export const guardianRiskEvents = mysqlTable("guardian_risk_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  counterpartUserId: int("counterpartUserId"),
  riskType: mysqlEnum("riskType", ["grooming", "scam", "violence", "self_harm", "unsafe_meetup", "identity_deception"]).notNull(),
  riskScore: float("riskScore").notNull(), // 0.00–1.00
  severityBand: mysqlEnum("severityBand", ["low", "moderate", "elevated", "high", "critical"]).notNull(),
  evidenceSummary: json("evidenceSummary").$type<Record<string, unknown>>(),
  interventionLevel: int("interventionLevel").default(1).notNull(), // 1–4
  status: mysqlEnum("status", ["open", "acknowledged", "resolved", "escalated", "false_positive"]).default("open").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuardianRiskEvent = typeof guardianRiskEvents.$inferSelect;
export type InsertGuardianRiskEvent = typeof guardianRiskEvents.$inferInsert;

// Verified Adult Credentials — identity/age verification records
export const verifiedAdultCredentials = mysqlTable("verified_adult_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  ageVerified: boolean("ageVerified").default(false).notNull(),
  identityVerified: boolean("identityVerified").default(false).notNull(),
  livenessVerified: boolean("livenessVerified").default(false).notNull(),
  screeningStatus: mysqlEnum("screeningStatus", ["none", "pending", "approved", "rejected"]).default("none").notNull(),
  interactionScope: mysqlEnum("interactionScope", ["none", "adult_only", "minor_allowed"]).default("none").notNull(),
  verificationMethod: varchar("verificationMethod", { length: 100 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VerifiedAdultCredential = typeof verifiedAdultCredentials.$inferSelect;

// Meetup Sessions — Safe Meet™ coordination records
export const meetupSessions = mysqlTable("meetup_sessions", {
  id: int("id").autoincrement().primaryKey(),
  initiatingUserId: int("initiatingUserId").notNull(),
  targetUserId: int("targetUserId").notNull(),
  agePolicyMode: mysqlEnum("agePolicyMode", ["adult_adult", "teen_teen", "adult_minor"]).default("adult_adult").notNull(),
  riskScore: float("riskScore").default(0),
  publicLocationRequired: boolean("publicLocationRequired").default(true).notNull(),
  plannedLocation: varchar("plannedLocation", { length: 500 }),
  plannedAt: timestamp("plannedAt"),
  durationEstimateMinutes: int("durationEstimateMinutes").default(60),
  checkinSchedule: json("checkinSchedule").$type<Array<{ label: string; offsetMinutes: number; completed: boolean }>>(),
  panicEnabled: boolean("panicEnabled").default(true).notNull(),
  trustContactVisibility: boolean("trustContactVisibility").default(false).notNull(),
  status: mysqlEnum("status", ["planned", "active", "completed", "panic_triggered", "canceled"]).default("planned").notNull(),
  arrivedAt: timestamp("arrivedAt"),
  completedAt: timestamp("completedAt"),
  panicTriggeredAt: timestamp("panicTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MeetupSession = typeof meetupSessions.$inferSelect;
export type InsertMeetupSession = typeof meetupSessions.$inferInsert;

// Panic Events — Panic Mode™ activations
export const panicEvents = mysqlTable("panic_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  meetupSessionId: int("meetupSessionId"),
  triggerType: mysqlEnum("triggerType", ["manual", "missed_checkin", "critical_risk", "explicit_signal"]).notNull(),
  locationLat: float("locationLat"),
  locationLng: float("locationLng"),
  locationAddress: varchar("locationAddress", { length: 500 }),
  contactsNotified: json("contactsNotified").$type<number[]>(), // trust contact IDs
  status: mysqlEnum("status", ["active", "resolved", "false_alarm"]).default("active").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PanicEvent = typeof panicEvents.$inferSelect;
export type InsertPanicEvent = typeof panicEvents.$inferInsert;

// Incidents — Trust & Safety Ops case management
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  reportedByUserId: int("reportedByUserId"),
  subjectUserId: int("subjectUserId").notNull(),
  incidentType: mysqlEnum("incidentType", ["grooming", "scam", "harassment", "impersonation", "csam", "violence_threat", "self_harm", "other"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  description: text("description"),
  evidenceVaultUri: varchar("evidenceVaultUri", { length: 500 }),
  caseStatus: mysqlEnum("caseStatus", ["open", "under_review", "action_taken", "closed", "appealed"]).default("open").notNull(),
  assignedTo: int("assignedTo"), // admin user ID
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// Content Safety Scans — media/text scan results
export const contentSafetyScans = mysqlTable("content_safety_scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentType: mysqlEnum("contentType", ["text", "image", "video", "audio"]).notNull(),
  contentRef: varchar("contentRef", { length: 500 }),
  scanResult: mysqlEnum("scanResult", ["safe", "flagged", "blocked"]).default("safe").notNull(),
  categories: json("categories").$type<string[]>(), // e.g. ['nudity','violence']
  confidence: float("confidence").default(0),
  action: mysqlEnum("action", ["allowed", "warned", "blocked", "escalated"]).default("allowed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentSafetyScan = typeof contentSafetyScans.$inferSelect;
