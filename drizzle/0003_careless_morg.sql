CREATE TABLE `automatic_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	`storage_key` text,
	`size` integer,
	`revision` integer,
	`error` text,
	`source` text NOT NULL
);
