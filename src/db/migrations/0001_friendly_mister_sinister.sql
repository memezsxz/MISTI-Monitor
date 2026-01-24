CREATE TABLE `ai_chat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
