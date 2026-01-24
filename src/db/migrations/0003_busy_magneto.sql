CREATE TABLE `actuator_states` (
	`id` text PRIMARY KEY NOT NULL,
	`part_id` text NOT NULL,
	`ts` text NOT NULL,
	`state` integer NOT NULL,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`svg_element_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parts_svg_element_id_unique` ON `parts` (`svg_element_id`);--> statement-breakpoint
CREATE TABLE `part_links` (
	`id` text PRIMARY KEY NOT NULL,
	`network_id` text,
	`from_part_id` text NOT NULL,
	`to_part_id` text NOT NULL,
	`relation` text NOT NULL,
	FOREIGN KEY (`from_part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`sensor_part_id` text NOT NULL,
	`ts` text NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`sensor_part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE cascade
);
