CREATE TABLE `backup_snapshots` (
	`backup_id` text NOT NULL,
	`collection` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`backup_id`, `collection`, `id`)
);
--> statement-breakpoint
CREATE INDEX `backup_snapshot_position` ON `backup_snapshots` (`backup_id`,`collection`,`position`);--> statement-breakpoint
CREATE TABLE `restore_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`base_revision` integer NOT NULL,
	`status` text NOT NULL,
	`manifest` text NOT NULL,
	`header` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `restore_parts` (
	`job_id` text NOT NULL,
	`path` text NOT NULL,
	`image_id` text,
	`target_id` text,
	`mime` text,
	PRIMARY KEY(`job_id`, `path`)
);
--> statement-breakpoint
ALTER TABLE `automatic_backups` ADD `format` text DEFAULT 'zip-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE `automatic_backups` ADD `progress` text;--> statement-breakpoint
ALTER TABLE `automatic_backups` ADD `lease_until` integer DEFAULT 0 NOT NULL;