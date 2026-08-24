CREATE TABLE `cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` text NOT NULL,
	`pay_amount` real NOT NULL,
	`pay_date` integer NOT NULL,
	`savings_method` text NOT NULL,
	`savings_amount` real NOT NULL,
	`recurring_bills_snapshot` text NOT NULL,
	`other_bills` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
