CREATE TABLE `failure_event_links` (
	`id` text PRIMARY KEY NOT NULL,
	`from_event_id` text NOT NULL,
	`to_event_id` text NOT NULL,
	`link_type` text,
	`metadata` text,
	FOREIGN KEY (`from_event_id`) REFERENCES `failure_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_event_id`) REFERENCES `failure_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `failure_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`probability` real,
	`severity` text,
	`detection` text,
	`metadata` text,
	`tags` text
);
