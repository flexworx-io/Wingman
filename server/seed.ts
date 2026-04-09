/**
 * Wingman.vip — Platform Data Seeder
 * Auto-runs on server startup. Idempotent — skips if data already exists.
 */
import { getDb, seedVirtualSpaces } from "./db";
import {
  conferenceEvents,
  platformStats,
  users,
  wingmanProfiles,
  userInterests,
  wingmanStories,
  activityFeed,
} from "../drizzle/schema";
import { sql, eq } from "drizzle-orm";

// ─── CONFERENCES ──────────────────────────────────────────────────────────────
async function seedConferences() {
  const db = await getDb();
  if (!db) return;
  const count = await db.select({ count: sql<number>`count(*)` }).from(conferenceEvents);
  if ((count[0]?.count ?? 0) > 0) return;

  const now = new Date();
  const future = (days: number) => new Date(now.getTime() + days * 86400000);

  await db.insert(conferenceEvents).values([
    {
      name: "AI Summit 2026",
      description: "The world's premier artificial intelligence conference bringing together researchers, engineers, and entrepreneurs shaping the future of AI.",
      location: "San Francisco, CA",
      category: "Technology",
      startDate: future(14),
      endDate: future(16),
      isActive: true,
    },
    {
      name: "Web3 & Blockchain World",
      description: "Explore decentralized finance, NFTs, DAOs, and the next generation of the internet.",
      location: "Miami, FL",
      category: "Blockchain",
      startDate: future(21),
      endDate: future(23),
      isActive: true,
    },
    {
      name: "TechCrunch Disrupt 2026",
      description: "The flagship startup conference where founders pitch, investors discover, and the next unicorns are born.",
      location: "New York, NY",
      category: "Startups",
      startDate: future(35),
      endDate: future(37),
      isActive: true,
    },
    {
      name: "Global Wellness Summit",
      description: "Connecting wellness professionals, researchers, and enthusiasts to advance human flourishing.",
      location: "Austin, TX",
      category: "Wellness",
      startDate: future(42),
      endDate: future(44),
      isActive: true,
    },
    {
      name: "Creative Industries Forum",
      description: "Where designers, artists, filmmakers, and creative technologists converge to shape culture.",
      location: "Los Angeles, CA",
      category: "Creative",
      startDate: future(56),
      endDate: future(58),
      isActive: true,
    },
    {
      name: "Future of Work Summit",
      description: "Reimagining how we work, collaborate, and build careers in the age of AI and remote-first culture.",
      location: "Chicago, IL",
      category: "Business",
      startDate: future(70),
      endDate: future(72),
      isActive: true,
    },
  ]);
  console.log("[Seed] ✅ Conferences seeded");
}

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────
async function seedPlatformStats() {
  const db = await getDb();
  if (!db) return;
  const count = await db.select({ count: sql<number>`count(*)` }).from(platformStats);
  if ((count[0]?.count ?? 0) > 0) return;

  const today = new Date().toISOString().split("T")[0]!;
  await db.insert(platformStats).values({
    date: today,
    totalUsers: 50247,
    activeWingmen: 48103,
    totalConnections: 2100000,
    totalIntroductions: 890000,
    avgCompatibilityScore: 94,
    newRegistrations: 1247,
  });
  console.log("[Seed] ✅ Platform stats seeded");
}

// ─── DEMO WINGMEN (for Discovery Engine) ─────────────────────────────────────
async function seedDemoWingmen() {
  const db = await getDb();
  if (!db) return;

  // Check if demo users already exist
  const existingDemoUsers = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.loginMethod, "demo"));
  if ((existingDemoUsers[0]?.count ?? 0) >= 8) return;

  const demoUsers = [
    { openId: "demo-aria-001", name: "Aria Chen", email: "aria@demo.wingman.vip" },
    { openId: "demo-nova-002", name: "Nova Williams", email: "nova@demo.wingman.vip" },
    { openId: "demo-kai-003", name: "Kai Patel", email: "kai@demo.wingman.vip" },
    { openId: "demo-luna-004", name: "Luna Rodriguez", email: "luna@demo.wingman.vip" },
    { openId: "demo-zeph-005", name: "Zephyr Thompson", email: "zephyr@demo.wingman.vip" },
    { openId: "demo-sage-006", name: "Sage Kim", email: "sage@demo.wingman.vip" },
    { openId: "demo-orion-007", name: "Orion Blake", email: "orion@demo.wingman.vip" },
    { openId: "demo-ember-008", name: "Ember Santos", email: "ember@demo.wingman.vip" },
  ];

  const wingmanData = [
    {
      wingmanName: "ARIA", tagline: "Connecting brilliant minds across the cosmos", catchphrase: "Your vibe attracts your tribe",
      aboutMe: "ARIA specializes in connecting creative professionals and tech innovators. She has an uncanny ability to detect intellectual compatibility.",
      avatarStyle: "aspirational" as const,
      socialMode: ["friendship", "business"] as string[], status: "active" as const,
      totalConnections: 847, totalIntroductions: 312, avgCompatibilityScore: 94,
    },
    {
      wingmanName: "NOVA", tagline: "Where hearts align under the stars", catchphrase: "Love is the ultimate algorithm",
      aboutMe: "NOVA is a romantic specialist who reads emotional compatibility with extraordinary precision.",
      avatarStyle: "fantasy" as const,
      socialMode: ["dating", "friendship"] as string[], status: "active" as const,
      totalConnections: 623, totalIntroductions: 198, avgCompatibilityScore: 91,
    },
    {
      wingmanName: "KAI", tagline: "Building empires one connection at a time", catchphrase: "Your network is your net worth",
      aboutMe: "KAI is the ultimate business connector. He analyzes professional goals, industry alignment, and growth trajectories.",
      avatarStyle: "realistic" as const,
      socialMode: ["business"] as string[], status: "active" as const,
      totalConnections: 1204, totalIntroductions: 567, avgCompatibilityScore: 89,
    },
    {
      wingmanName: "LUNA", tagline: "Family first, always and forever", catchphrase: "Together we grow stronger",
      aboutMe: "LUNA specializes in family connections and community building.",
      avatarStyle: "cartoon" as const,
      socialMode: ["family", "friendship"] as string[], status: "active" as const,
      totalConnections: 389, totalIntroductions: 145, avgCompatibilityScore: 96,
    },
    {
      wingmanName: "ZEPHYR", tagline: "Adventure awaits around every corner", catchphrase: "Life is better with the right crew",
      aboutMe: "ZEPHYR connects adventurers, travelers, and outdoor enthusiasts.",
      avatarStyle: "aspirational" as const,
      socialMode: ["friendship"] as string[], status: "active" as const,
      totalConnections: 712, totalIntroductions: 289, avgCompatibilityScore: 88,
    },
    {
      wingmanName: "SAGE", tagline: "Wisdom connects what logic cannot", catchphrase: "The right introduction changes everything",
      aboutMe: "SAGE is a multi-modal connector who excels at finding unexpected compatibility across different life domains.",
      avatarStyle: "fantasy" as const,
      socialMode: ["friendship", "dating", "business"] as string[], status: "active" as const,
      totalConnections: 934, totalIntroductions: 421, avgCompatibilityScore: 92,
    },
    {
      wingmanName: "ORION", tagline: "Precision matching at cosmic scale", catchphrase: "Every star has its constellation",
      aboutMe: "ORION uses deep personality analysis to find connections that transcend surface-level compatibility.",
      avatarStyle: "aspirational" as const,
      socialMode: ["friendship", "business"] as string[], status: "active" as const,
      totalConnections: 556, totalIntroductions: 234, avgCompatibilityScore: 93,
    },
    {
      wingmanName: "EMBER", tagline: "Sparking connections that ignite lives", catchphrase: "The warmest introductions last forever",
      aboutMe: "EMBER specializes in creating warm, authentic connections between people who share deep values.",
      avatarStyle: "cartoon" as const,
      socialMode: ["dating", "friendship"] as string[], status: "active" as const,
      totalConnections: 478, totalIntroductions: 189, avgCompatibilityScore: 95,
    },
  ];

  const interestSets = [
    [{ category: "Technology", interest: "AI & Machine Learning" }, { category: "Arts", interest: "Digital Art" }],
    [{ category: "Romance", interest: "Romantic Dinners" }, { category: "Wellness", interest: "Yoga" }],
    [{ category: "Business", interest: "Startups" }, { category: "Technology", interest: "Blockchain" }],
    [{ category: "Family", interest: "Parenting" }, { category: "Wellness", interest: "Nutrition" }],
    [{ category: "Adventure", interest: "Rock Climbing" }, { category: "Travel", interest: "Backpacking" }],
    [{ category: "Philosophy", interest: "Stoicism" }, { category: "Technology", interest: "AI Ethics" }],
    [{ category: "Science", interest: "Astronomy" }, { category: "Technology", interest: "Space Tech" }],
    [{ category: "Wellness", interest: "Meditation" }, { category: "Arts", interest: "Painting" }],
  ];

  const storyTitles = [
    "ARIA connected two AI researchers who co-founded a startup",
    "NOVA orchestrated a perfect first meeting at a rooftop garden",
    "KAI's introduction led to a $2M partnership deal",
    "LUNA brought two families together at a community garden",
    "ZEPHYR matched two climbers who summited Kilimanjaro together",
    "SAGE's unexpected introduction sparked a creative collaboration",
    "ORION found a 97% compatibility match across 3 continents",
    "EMBER's warm introduction turned into a year-long friendship",
  ];

  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i]!;
    const wm = wingmanData[i]!;

    // Insert demo user
    await db.insert(users).values({
      openId: user.openId,
      name: user.name,
      email: user.email,
      loginMethod: "demo",
      role: "user" as const,
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({ set: { name: user.name } });

    // Get user id
    const userRow = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (!userRow[0]) continue;
    const userId = userRow[0].id;

    // Check if wingman already exists
    const existingWm = await db.select().from(wingmanProfiles).where(eq(wingmanProfiles.userId, userId)).limit(1);
    if (existingWm.length > 0) continue;

    // Insert wingman profile (only schema-valid fields)
    const wmResult = await db.insert(wingmanProfiles).values({
      userId,
      wingmanName: wm.wingmanName,
      tagline: wm.tagline,
      catchphrase: wm.catchphrase,
      aboutMe: wm.aboutMe,
      avatarStyle: wm.avatarStyle,
      socialMode: wm.socialMode,
      status: wm.status,
      totalConnections: wm.totalConnections,
      totalIntroductions: wm.totalIntroductions,
      avgCompatibilityScore: wm.avgCompatibilityScore,
    });
    const wingmanId = (wmResult[0] as any).insertId as number;

    // Seed interests
    for (const interest of interestSets[i] || []) {
      await db.insert(userInterests).values({ userId, category: interest.category, interest: interest.interest })
        .onDuplicateKeyUpdate({ set: { category: interest.category } });
    }

    // Seed a sample story
    await db.insert(wingmanStories).values({
      wingmanId,
      title: storyTitles[i] ?? `${wm.wingmanName} made a great connection`,
      summary: `This is the story of how ${wm.wingmanName} made a life-changing introduction using advanced personality matching.`,
      storyType: "introduction",
      isWatched: false,
    });

    // Seed activity feed entry
    await db.insert(activityFeed).values({
      wingmanId,
      activityType: "scan",
      title: `${wm.wingmanName} is scanning for matches`,
      description: `${wm.wingmanName} is actively scanning for compatible connections`,
      metadata: { status: "active", scanned: Math.floor(Math.random() * 5000) + 1000 },
    });
  }

  console.log("[Seed] ✅ Demo Wingmen seeded");
}

// ─── MAIN SEED RUNNER ─────────────────────────────────────────────────────────
export async function runSeed() {
  try {
    console.log("[Seed] 🌱 Starting platform data seed...");
    await seedVirtualSpaces();
    await seedConferences();
    await seedPlatformStats();
    await seedDemoWingmen();
    console.log("[Seed] ✅ All seed operations complete");
  } catch (err) {
    console.error("[Seed] ❌ Seed error:", err);
    // Non-fatal — server continues even if seed fails
  }
}
