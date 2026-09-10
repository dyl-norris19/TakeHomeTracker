/*
 HAND-EDITED after generation: the two `INSERT ... SELECT` statements below were
 changed to convert values, not just copy them. Everything else is as generated.

   pay_amount    (real dollars)  -> pay_amount_cents      = round(x * 100)
   savings_amount (real, dual)   -> savings_flat_cents     when method = 'flat'
                                 -> savings_basis_points   when method = 'percent'  (15 -> 1500)
   amount        (real dollars)  -> amount_cents           = round(x * 100)
   the {"amount": n} entries inside recurring_bills_snapshot / other_bills
                                 -> {"amountCents": round(n * 100)}
*/
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` text NOT NULL,
	`year` integer DEFAULT 0 NOT NULL,
	`paycheck_number` integer DEFAULT 1 NOT NULL,
	`pay_amount_cents` integer NOT NULL,
	`pay_date` integer NOT NULL,
	`savings_method` text NOT NULL,
	`savings_flat_cents` integer,
	`savings_basis_points` integer,
	`recurring_bills_snapshot` text NOT NULL,
	`other_bills` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cards`("id", "user_id", "month", "year", "paycheck_number", "pay_amount_cents", "pay_date", "savings_method", "savings_flat_cents", "savings_basis_points", "recurring_bills_snapshot", "other_bills")
SELECT
	"id", "user_id", "month", "year", "paycheck_number",
	CAST(ROUND("pay_amount" * 100) AS integer),
	"pay_date",
	"savings_method",
	CASE WHEN "savings_method" = 'flat' THEN CAST(ROUND("savings_amount" * 100) AS integer) END,
	CASE WHEN "savings_method" = 'percent' THEN CAST(ROUND("savings_amount" * 100) AS integer) END,
	COALESCE((
		SELECT json_group_array(json_object(
			'name', json_extract(value, '$.name'),
			'amountCents', CAST(ROUND(json_extract(value, '$.amount') * 100) AS integer)
		))
		FROM json_each("cards"."recurring_bills_snapshot")
	), '[]'),
	COALESCE((
		SELECT json_group_array(json_object(
			'name', json_extract(value, '$.name'),
			'amountCents', CAST(ROUND(json_extract(value, '$.amount') * 100) AS integer)
		))
		FROM json_each("cards"."other_bills")
	), '[]')
FROM `cards`;--> statement-breakpoint
DROP TABLE `cards`;--> statement-breakpoint
ALTER TABLE `__new_cards` RENAME TO `cards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_recurring_bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recurring_bills`("id", "user_id", "name", "amount_cents") SELECT "id", "user_id", "name", CAST(ROUND("amount" * 100) AS integer) FROM `recurring_bills`;--> statement-breakpoint
DROP TABLE `recurring_bills`;--> statement-breakpoint
ALTER TABLE `__new_recurring_bills` RENAME TO `recurring_bills`;