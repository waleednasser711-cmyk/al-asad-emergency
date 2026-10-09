ALTER TABLE `users` ADD `warehouse_category` text;--> statement-breakpoint
ALTER TABLE `users` ADD `warehouse_permissions` text DEFAULT '{}' NOT NULL;