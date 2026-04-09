import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

const migrations = [
  // ── Organizations (tenants) ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    plan ENUM('free','starter','professional','enterprise') NOT NULL DEFAULT 'free',
    maxUsers INT NOT NULL DEFAULT 10,
    config JSON,
    ownerId INT,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // ── Email Verifications ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt TIMESTAMP NOT NULL,
    usedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // ── OAuth Accounts ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS oauth_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    provider ENUM('google','microsoft','manus') NOT NULL,
    providerAccountId VARCHAR(255) NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    expiresAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_provider_account (provider, providerAccountId)
  )`,

  // ── Alter users: add auth + tenant fields ────────────────────────────────
  `ALTER TABLE users
    ADD COLUMN IF NOT EXISTS orgId INT NULL,
    ADD COLUMN IF NOT EXISTS passwordHash VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS authProvider ENUM('email','google','microsoft','manus') NOT NULL DEFAULT 'manus',
    ADD COLUMN IF NOT EXISTS isSuperAdmin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS suspendedAt TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS suspendReason TEXT NULL`,

  // ── Add orgId to wingman_profiles ────────────────────────────────────────
  `ALTER TABLE wingman_profiles ADD COLUMN IF NOT EXISTS orgId INT NULL`,

  // ── Add orgId to virtual_spaces ──────────────────────────────────────────
  `ALTER TABLE virtual_spaces ADD COLUMN IF NOT EXISTS orgId INT NULL`,

  // ── Add orgId to conference_events ───────────────────────────────────────
  `ALTER TABLE conference_events ADD COLUMN IF NOT EXISTS orgId INT NULL`,

  // ── Add orgId to admin_logs ──────────────────────────────────────────────
  `ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS orgId INT NULL`,

  // ── Password reset tokens ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt TIMESTAMP NOT NULL,
    usedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // ── Tenant invitations ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS org_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orgId INT NOT NULL,
    email VARCHAR(320) NOT NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    token VARCHAR(255) NOT NULL UNIQUE,
    invitedBy INT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    acceptedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

console.log('Running multi-tenant migration...');
for (const sql of migrations) {
  try {
    await db.execute(sql);
    const tableName = sql.match(/TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1] || 
                      sql.match(/ALTER TABLE\s+(\w+)/i)?.[1] || 'unknown';
    console.log(`✓ ${tableName}`);
  } catch (err) {
    console.error(`✗ Error: ${err.message}`);
    console.error(`  SQL: ${sql.substring(0, 80)}...`);
  }
}

await db.end();
console.log('Migration complete.');
