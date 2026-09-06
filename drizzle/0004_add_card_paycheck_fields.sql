ALTER TABLE `cards` ADD `year` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `paycheck_number` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE `cards` SET `year` = CAST(strftime('%Y', `pay_date`, 'unixepoch') AS integer) WHERE `year` = 0;