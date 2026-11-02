ALTER TABLE `cards` RENAME COLUMN `savings_method` TO `budget_method`;--> statement-breakpoint
ALTER TABLE `cards` RENAME COLUMN `savings_flat_cents` TO `budget_flat_cents`;--> statement-breakpoint
ALTER TABLE `cards` RENAME COLUMN `savings_basis_points` TO `budget_basis_points`;--> statement-breakpoint
ALTER TABLE `cards` ADD `budget_mode` text DEFAULT 'splurge' NOT NULL;
