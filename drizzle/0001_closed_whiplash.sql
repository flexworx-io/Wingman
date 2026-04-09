CREATE TABLE `activity_feed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanId` int NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`metadata` json,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_feed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(200) NOT NULL,
	`targetType` varchar(100),
	`targetId` int,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conference_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`description` text,
	`location` varchar(300),
	`startDate` timestamp,
	`endDate` timestamp,
	`category` varchar(100),
	`imageUrl` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conference_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conference_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conferenceId` int NOT NULL,
	`wingmanId` int NOT NULL,
	`userId` int NOT NULL,
	`connectionGoals` json,
	`scheduledMeetings` json,
	`briefingGenerated` boolean DEFAULT false,
	`briefingContent` text,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conference_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanId` int NOT NULL,
	`connectedWingmanId` int NOT NULL,
	`compatibilityScore` float DEFAULT 0,
	`status` enum('pending','active','paused','blocked') NOT NULL DEFAULT 'pending',
	`introducedAt` timestamp NOT NULL DEFAULT (now()),
	`humanMeetingAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanAId` int NOT NULL,
	`wingmanBId` int NOT NULL,
	`murphConversationId` varchar(200),
	`status` enum('initiating','in_progress','completed','failed') DEFAULT 'initiating',
	`compatibilityScore` float,
	`summary` text,
	`outcome` enum('matched','no_match','pending','human_intro_requested'),
	`transcript` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dream_board` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanId` int NOT NULL,
	`targetWingmanId` int NOT NULL,
	`compatibilityScore` float DEFAULT 0,
	`sharedTraits` json,
	`aiVisualizationUrl` text,
	`status` enum('potential','introduced','connected','dismissed') DEFAULT 'potential',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dream_board_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newConnection` boolean DEFAULT true,
	`introductionComplete` boolean DEFAULT true,
	`compatibilityMatch` boolean DEFAULT true,
	`travelAlert` boolean DEFAULT true,
	`conferenceMatch` boolean DEFAULT true,
	`weeklyDigest` boolean DEFAULT true,
	`pushEnabled` boolean DEFAULT true,
	`emailEnabled` boolean DEFAULT true,
	`pushToken` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(300) NOT NULL,
	`body` text,
	`metadata` json,
	`isRead` boolean DEFAULT false,
	`isPush` boolean DEFAULT false,
	`isEmail` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personality_traits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanId` int NOT NULL,
	`openness` int DEFAULT 50,
	`conscientiousness` int DEFAULT 50,
	`extraversion` int DEFAULT 50,
	`agreeableness` int DEFAULT 50,
	`emotionalDepth` int DEFAULT 50,
	`socialEnergy` int DEFAULT 50,
	`practicalVsImaginative` int DEFAULT 50,
	`headVsHeart` int DEFAULT 50,
	`structuredVsFlexible` int DEFAULT 50,
	`motivationStyle` int DEFAULT 50,
	`growthMindset` int DEFAULT 50,
	`purposeFocus` int DEFAULT 50,
	`honestyOpenness` int DEFAULT 50,
	`emotionalAwareness` int DEFAULT 50,
	`socialConfidence` int DEFAULT 50,
	`flexibility` int DEFAULT 50,
	`reliability` int DEFAULT 50,
	`curiosity` int DEFAULT 50,
	`formality` int DEFAULT 50,
	`directness` int DEFAULT 50,
	`humor` int DEFAULT 50,
	`warmth` int DEFAULT 50,
	`responseSpeed` int DEFAULT 50,
	`adventurousness` int DEFAULT 50,
	`researchMindset` int DEFAULT 50,
	`intuition` int DEFAULT 50,
	`teamwork` int DEFAULT 50,
	`initiative` int DEFAULT 50,
	`imagination` int DEFAULT 50,
	`attentionToDetail` int DEFAULT 50,
	`resilience` int DEFAULT 50,
	`adaptability` int DEFAULT 50,
	`independence` int DEFAULT 50,
	`trust` int DEFAULT 50,
	`generatedDescription` text,
	`selectedStyles` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personality_traits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(20) NOT NULL,
	`totalUsers` int DEFAULT 0,
	`activeWingmen` int DEFAULT 0,
	`totalConnections` int DEFAULT 0,
	`totalIntroductions` int DEFAULT 0,
	`avgCompatibilityScore` float DEFAULT 0,
	`newRegistrations` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_stats_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `space_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`wingmanId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	CONSTRAINT `space_presence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `travel_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wingmanId` int NOT NULL,
	`city` varchar(200) NOT NULL,
	`country` varchar(100),
	`lat` float,
	`lng` float,
	`arrivalAt` timestamp,
	`departureAt` timestamp,
	`isActive` boolean DEFAULT true,
	`friendsNotified` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `travel_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trust_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanId` int NOT NULL,
	`targetWingmanId` int NOT NULL,
	`level` enum('public','acquaintance','connection','trusted','inner_circle') NOT NULL DEFAULT 'public',
	`levelNum` int NOT NULL DEFAULT 1,
	`sharedInfo` json,
	`initiatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trust_levels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_interests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`interest` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_interests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virtual_spaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`socialMode` enum('friendship','dating','business','family','all') DEFAULT 'all',
	`imageUrl` text,
	`activeWingmen` int DEFAULT 0,
	`maxCapacity` int DEFAULT 100,
	`isActive` boolean DEFAULT true,
	`location` varchar(200),
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `virtual_spaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wingman_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wingmanName` varchar(100) NOT NULL,
	`tagline` text,
	`aboutMe` text,
	`catchphrase` text,
	`avatarUrl` text,
	`avatarStyle` enum('cartoon','realistic','fantasy','aspirational') DEFAULT 'realistic',
	`avatarAesthetic` varchar(100),
	`voiceId` varchar(50),
	`personalityArchetype` varchar(100),
	`signatureStrength` varchar(100),
	`signatureStrengthScore` int DEFAULT 50,
	`socialMode` json NOT NULL,
	`status` enum('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
	`trustLevel` int DEFAULT 1,
	`verificationStatus` enum('unverified','bronze','silver','gold','platinum') DEFAULT 'unverified',
	`murphHseId` varchar(200),
	`isOnline` boolean DEFAULT false,
	`lastActiveAt` timestamp,
	`totalConnections` int DEFAULT 0,
	`totalIntroductions` int DEFAULT 0,
	`avgCompatibilityScore` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wingman_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wingman_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingmanId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`summary` text,
	`storyType` varchar(100),
	`thumbnailUrl` text,
	`videoUrl` text,
	`duration` int DEFAULT 0,
	`isWatched` boolean DEFAULT false,
	`relatedConnectionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wingman_stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(200);--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('teen','adult') DEFAULT 'adult' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','premium','enterprise') DEFAULT 'free' NOT NULL;