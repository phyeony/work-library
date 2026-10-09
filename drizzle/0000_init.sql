CREATE TABLE `allowed_emails` (
	`email` text PRIMARY KEY NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`added_by` text,
	`added_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`row_id` integer NOT NULL,
	`position` integer NOT NULL,
	`period_label` text NOT NULL,
	`week` integer,
	`theme` text,
	`title` text NOT NULL,
	`title_key` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`row_id`) REFERENCES `shelf_rows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `books_row_idx` ON `books` (`row_id`,`position`);--> statement-breakpoint
CREATE INDEX `books_title_key_idx` ON `books` (`title_key`);--> statement-breakpoint
CREATE TABLE `isbn_links` (
	`isbn` text PRIMARY KEY NOT NULL,
	`title_key` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shelf_rows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shelf_id` integer NOT NULL,
	`label` text NOT NULL,
	`row_from_bottom` integer NOT NULL,
	FOREIGN KEY (`shelf_id`) REFERENCES `shelves`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shelf_rows_shelf_idx` ON `shelf_rows` (`shelf_id`);--> statement-breakpoint
CREATE TABLE `shelves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL
);
