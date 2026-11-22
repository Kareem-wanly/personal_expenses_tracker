ALTER TABLE `income` ADD `recurring_id` text REFERENCES recurring_expense(id);--> statement-breakpoint
CREATE UNIQUE INDEX `income_recurring_date_uq` ON `income` (`recurring_id`,`date`);--> statement-breakpoint
ALTER TABLE `recurring_expense` ADD `kind` text DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_expense` ADD `source` text;