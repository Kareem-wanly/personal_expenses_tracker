-- Move categories still on the old stock palette to the new one.
-- Only exact matches change; custom colours a user picked stay as they are.
UPDATE `category` SET `color` = '#c8502b' WHERE lower(`color`) = '#f97316';--> statement-breakpoint
UPDATE `category` SET `color` = '#b33a2e' WHERE lower(`color`) = '#ef4444';--> statement-breakpoint
UPDATE `category` SET `color` = '#b9506c' WHERE lower(`color`) = '#ec4899';--> statement-breakpoint
UPDATE `category` SET `color` = '#7d4e86' WHERE lower(`color`) = '#8b5cf6';--> statement-breakpoint
UPDATE `category` SET `color` = '#4f55a0' WHERE lower(`color`) = '#6366f1';--> statement-breakpoint
UPDATE `category` SET `color` = '#3e64a0' WHERE lower(`color`) = '#3b82f6';--> statement-breakpoint
UPDATE `category` SET `color` = '#3a86a0' WHERE lower(`color`) = '#06b6d4';--> statement-breakpoint
UPDATE `category` SET `color` = '#2c7a78' WHERE lower(`color`) = '#14b8a6';--> statement-breakpoint
UPDATE `category` SET `color` = '#4c8a5b' WHERE lower(`color`) = '#10b981';--> statement-breakpoint
UPDATE `category` SET `color` = '#7a8233' WHERE lower(`color`) = '#84cc16';--> statement-breakpoint
UPDATE `category` SET `color` = '#c79227' WHERE lower(`color`) = '#eab308';--> statement-breakpoint
UPDATE `category` SET `color` = '#6f6a60' WHERE lower(`color`) = '#64748b';
