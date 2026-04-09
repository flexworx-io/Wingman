CREATE TABLE `content_safety_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentType` enum('text','image','video','audio') NOT NULL,
	`contentRef` varchar(500),
	`scanResult` enum('safe','flagged','blocked') NOT NULL DEFAULT 'safe',
	`categories` json,
	`confidence` float DEFAULT 0,
	`action` enum('allowed','warned','blocked','escalated') NOT NULL DEFAULT 'allowed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_safety_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardian_risk_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`counterpartUserId` int,
	`riskType` enum('grooming','scam','violence','self_harm','unsafe_meetup','identity_deception') NOT NULL,
	`riskScore` float NOT NULL,
	`severityBand` enum('low','moderate','elevated','high','critical') NOT NULL,
	`evidenceSummary` json,
	`interventionLevel` int NOT NULL DEFAULT 1,
	`status` enum('open','acknowledged','resolved','escalated','false_positive') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guardian_risk_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportedByUserId` int,
	`subjectUserId` int NOT NULL,
	`incidentType` enum('grooming','scam','harassment','impersonation','csam','violence_threat','self_harm','other') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`description` text,
	`evidenceVaultUri` varchar(500),
	`caseStatus` enum('open','under_review','action_taken','closed','appealed') NOT NULL DEFAULT 'open',
	`assignedTo` int,
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetup_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initiatingUserId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`agePolicyMode` enum('adult_adult','teen_teen','adult_minor') NOT NULL DEFAULT 'adult_adult',
	`riskScore` float DEFAULT 0,
	`publicLocationRequired` boolean NOT NULL DEFAULT true,
	`plannedLocation` varchar(500),
	`plannedAt` timestamp,
	`durationEstimateMinutes` int DEFAULT 60,
	`checkinSchedule` json,
	`panicEnabled` boolean NOT NULL DEFAULT true,
	`trustContactVisibility` boolean NOT NULL DEFAULT false,
	`status` enum('planned','active','completed','panic_triggered','canceled') NOT NULL DEFAULT 'planned',
	`arrivedAt` timestamp,
	`completedAt` timestamp,
	`panicTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetup_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `panic_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`meetupSessionId` int,
	`triggerType` enum('manual','missed_checkin','critical_risk','explicit_signal') NOT NULL,
	`locationLat` float,
	`locationLng` float,
	`locationAddress` varchar(500),
	`contactsNotified` json,
	`status` enum('active','resolved','false_alarm') NOT NULL DEFAULT 'active',
	`resolvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `panic_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trust_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`relationship` varchar(100) NOT NULL,
	`phone` varchar(30),
	`email` varchar(320),
	`priorityOrder` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trust_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verified_adult_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ageVerified` boolean NOT NULL DEFAULT false,
	`identityVerified` boolean NOT NULL DEFAULT false,
	`livenessVerified` boolean NOT NULL DEFAULT false,
	`screeningStatus` enum('none','pending','approved','rejected') NOT NULL DEFAULT 'none',
	`interactionScope` enum('none','adult_only','minor_allowed') NOT NULL DEFAULT 'none',
	`verificationMethod` varchar(100),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verified_adult_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `verified_adult_credentials_userId_unique` UNIQUE(`userId`)
);
