import mysql2 from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

const tables = [
  `CREATE TABLE IF NOT EXISTS \`interviews\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`mode\` enum('voice','text','hybrid') NOT NULL DEFAULT 'text',
    \`status\` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
    \`transcript\` text,
    \`audioUri\` varchar(500),
    \`semanticFeaturesJson\` json,
    \`voiceFeaturesJson\` json,
    \`questionCount\` int DEFAULT 0,
    \`predictionCount\` int DEFAULT 0,
    \`predictionAccuracy\` float DEFAULT 0,
    \`startedAt\` timestamp NOT NULL DEFAULT (now()),
    \`completedAt\` timestamp,
    CONSTRAINT \`interviews_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`trait_evidence\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`interviewId\` int,
    \`traitCode\` varchar(100) NOT NULL,
    \`sourceType\` enum('interview_transcript','voice_tone','rapid_preference','scenario_response','direct_preference','prediction_validation','contradiction_followup') NOT NULL,
    \`rawScore\` float NOT NULL,
    \`normalizedScore\` float NOT NULL,
    \`weightUsed\` float NOT NULL,
    \`confidence\` float NOT NULL,
    \`explanation\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`trait_evidence_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`user_trait_profiles\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`profileVersion\` int NOT NULL DEFAULT 1,
    \`traitVectorJson\` json NOT NULL,
    \`confidenceVectorJson\` json NOT NULL,
    \`predictionScore\` float DEFAULT 0,
    \`contradictionVectorJson\` json,
    \`frictionVectorJson\` json,
    \`overallConfidence\` float DEFAULT 0,
    \`certifiedAt\` timestamp,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`user_trait_profiles_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`companion_needs_profiles\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`needsVectorJson\` json NOT NULL,
    \`mode\` enum('best_friend','social_coordinator','dating_support','business_networking','family_coordinator') NOT NULL DEFAULT 'best_friend',
    \`rationale\` json,
    \`chemistryScore\` float DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`companion_needs_profiles_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`prediction_events\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`interviewId\` int,
    \`questionId\` varchar(100) NOT NULL,
    \`predictedDistributionJson\` json NOT NULL,
    \`actualAnswerJson\` json,
    \`accuracyScore\` float,
    \`revealCopy\` text NOT NULL,
    \`confirmedFlag\` enum('pending','confirmed','denied','softened','intensified') NOT NULL DEFAULT 'pending',
    \`delightScore\` float DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`prediction_events_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`contradiction_events\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`interviewId\` int,
    \`traitCode\` varchar(100) NOT NULL,
    \`selfValue\` float,
    \`observedValue\` float,
    \`predictedValue\` float,
    \`contradictionScore\` float NOT NULL,
    \`insightType\` enum('aspirational_identity','self_deception','hidden_pain','context_dependent','blind_spot') NOT NULL DEFAULT 'context_dependent',
    \`resolutionStatus\` enum('pending','resolved','accepted','dismissed') NOT NULL DEFAULT 'pending',
    \`resolutionNote\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`contradiction_events_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`social_memory_entries\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`wingmanId\` int NOT NULL,
    \`memoryType\` enum('personality','social','relationship','preference','planning') NOT NULL,
    \`summary\` text NOT NULL,
    \`retrievalEmbeddingRef\` varchar(500),
    \`accessScope\` enum('private','wingman_only','trusted','public') NOT NULL DEFAULT 'wingman_only',
    \`importance\` float DEFAULT 0.5,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`social_memory_entries_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`wingman_interactions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`initiatorWingmanId\` int NOT NULL,
    \`targetWingmanId\` int NOT NULL,
    \`interactionType\` enum('introduction','compatibility_check','social_plan','group_coordination','mood_checkin','referral') NOT NULL,
    \`summary\` text,
    \`consentFlags\` json,
    \`safetyCheckResult\` enum('passed','flagged','blocked') NOT NULL DEFAULT 'passed',
    \`chemistryScore\` float,
    \`outcome\` enum('pending','accepted','declined','completed','expired') NOT NULL DEFAULT 'pending',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`wingman_interactions_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of tables) {
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `([^`]+)`/)?.[1];
  try {
    await conn.execute(sql);
    console.log(`✓ ${tableName}`);
  } catch (e) {
    console.error(`✗ ${tableName}: ${e.message}`);
  }
}

await conn.end();
console.log('\n✅ MAESTRO migration complete');
