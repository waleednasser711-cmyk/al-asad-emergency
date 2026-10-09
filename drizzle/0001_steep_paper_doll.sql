CREATE TABLE `records` (
	`collection` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`collection`, `id`)
);
--> statement-breakpoint
ALTER TABLE `office` ADD `mutation` text DEFAULT '' NOT NULL;