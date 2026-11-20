CREATE TABLE `recurring_expense` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`amount` integer NOT NULL,
	`note` text,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`next_date` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `recurring_user_idx` ON `recurring_expense` (`user_id`);--> statement-breakpoint
CREATE INDEX `recurring_due_idx` ON `recurring_expense` (`active`,`next_date`);--> statement-breakpoint
ALTER TABLE `category` ADD `budget` integer;--> statement-breakpoint
ALTER TABLE `expense` ADD `recurring_id` text REFERENCES recurring_expense(id);--> statement-breakpoint
CREATE UNIQUE INDEX `expense_recurring_date_uq` ON `expense` (`recurring_id`,`date`);--> statement-breakpoint
ALTER TABLE `user` ADD `notify_recurring` integer DEFAULT true NOT NULL;