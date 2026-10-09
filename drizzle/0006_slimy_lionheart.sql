CREATE TABLE `rep_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text NOT NULL,
	`reviewed_at` text,
	`reviewed_by` text,
	`reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rep_device_token` ON `rep_devices` (`user_id`,`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `rep_one_approved_device` ON `rep_devices` (`user_id`) WHERE "rep_devices"."status" = 'approved';--> statement-breakpoint
ALTER TABLE `sessions` ADD `device_id` text;