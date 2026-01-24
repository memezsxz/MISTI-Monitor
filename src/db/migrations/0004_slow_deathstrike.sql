ALTER TABLE `parts` ADD `description` text DEFAULT '';--> statement-breakpoint
ALTER TABLE `part_links` DROP COLUMN `network_id`;--> statement-breakpoint
ALTER TABLE `part_links` DROP COLUMN `relation`;