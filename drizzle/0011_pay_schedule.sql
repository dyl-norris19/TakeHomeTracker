/*
 HAND-EDITED after generation: the `INSERT ... SELECT` below was rewritten to
 convert the old columns. Everything else is as generated.

   frequency (int 1 / 2 / 4)     -> frequency text 'monthly' / 'biweekly' / 'weekly'
   paydate   (unix seconds)      -> anchor_date 'YYYY-MM-DD'   when weekly / biweekly
                                 -> pay_day_1 (day of month)   when monthly
   weekend_rule                  -> 'none', so existing schedules land on the same days as before
   take_home_cents               -> NULL (not set yet)

 `paydate` was saved as the browser's local midnight. Adding 12 hours before
 taking the UTC date gives back that calendar day for any offset from UTC-12
 to UTC+12.
*/
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payday_settings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`frequency` text NOT NULL,
	`anchor_date` text,
	`pay_day_1` integer,
	`pay_day_2` integer,
	`weekend_rule` text DEFAULT 'none' NOT NULL,
	`take_home_cents` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payday_settings`("user_id", "frequency", "anchor_date", "pay_day_1", "pay_day_2", "weekend_rule", "take_home_cents")
SELECT
	"user_id",
	CASE "frequency" WHEN 1 THEN 'monthly' WHEN 2 THEN 'biweekly' ELSE 'weekly' END,
	CASE WHEN "frequency" = 1 THEN NULL ELSE date("paydate" + 43200, 'unixepoch') END,
	CASE WHEN "frequency" = 1 THEN CAST(strftime('%d', "paydate" + 43200, 'unixepoch') AS INTEGER) ELSE NULL END,
	NULL,
	'none',
	NULL
FROM `payday_settings`;--> statement-breakpoint
DROP TABLE `payday_settings`;--> statement-breakpoint
ALTER TABLE `__new_payday_settings` RENAME TO `payday_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
