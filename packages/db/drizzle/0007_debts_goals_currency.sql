CREATE TABLE `debt` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`direction` text NOT NULL,
	`person` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`note` text,
	`date` text NOT NULL,
	`due_date` text,
	`settled_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `debt_user_idx` ON `debt` (`user_id`,`settled_at`);--> statement-breakpoint
CREATE TABLE `debt_payment` (
	`id` text PRIMARY KEY NOT NULL,
	`debt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debt`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `debt_payment_debt_idx` ON `debt_payment` (`debt_id`);--> statement-breakpoint
CREATE TABLE `goal_contribution` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `saving_goal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `goal_contribution_goal_idx` ON `goal_contribution` (`goal_id`);--> statement-breakpoint
CREATE TABLE `saving_goal` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT '🎯' NOT NULL,
	`target` integer NOT NULL,
	`currency` text NOT NULL,
	`deadline` text,
	`achieved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saving_goal_user_idx` ON `saving_goal` (`user_id`);--> statement-breakpoint
ALTER TABLE `expense` ADD `original_amount` integer;--> statement-breakpoint
ALTER TABLE `expense` ADD `original_currency` text;--> statement-breakpoint
ALTER TABLE `income` ADD `original_amount` integer;--> statement-breakpoint
ALTER TABLE `income` ADD `original_currency` text;--> statement-breakpoint
ALTER TABLE `user` ADD `notify_debts` integer DEFAULT true NOT NULL;