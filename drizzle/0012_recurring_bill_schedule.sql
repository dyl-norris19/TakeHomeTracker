/*
 HAND-EDITED after generation: the `INSERT ... SELECT` below was rewritten to
 convert existing bills. Everything else is as generated.

 Every existing bill becomes a flat `split` bill, which goes on every card,
 the same as before. A split bill's amount is the monthly total, divided
 across a normal month's paychecks, so the old per-paycheck amount is
 multiplied by that count to keep each card's share unchanged:

   weekly 4, biweekly 2, semimonthly 2, monthly 1, no pay schedule saved 1

 Runs after 0011, so payday_settings.frequency is already text.
*/
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recurring_bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`amount_type` text DEFAULT 'flat' NOT NULL,
	`amount_cents` integer,
	`basis_points` integer,
	`allocation` text DEFAULT 'split' NOT NULL,
	`due_day` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recurring_bills`("id", "user_id", "name", "amount_type", "amount_cents", "basis_points", "allocation", "due_day")
SELECT
	b."id",
	b."user_id",
	b."name",
	'flat',
	b."amount_cents" * CASE p."frequency" WHEN 'weekly' THEN 4 WHEN 'biweekly' THEN 2 WHEN 'semimonthly' THEN 2 ELSE 1 END,
	NULL,
	'split',
	NULL
FROM `recurring_bills` b
LEFT JOIN `payday_settings` p ON p."user_id" = b."user_id";--> statement-breakpoint
DROP TABLE `recurring_bills`;--> statement-breakpoint
ALTER TABLE `__new_recurring_bills` RENAME TO `recurring_bills`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
