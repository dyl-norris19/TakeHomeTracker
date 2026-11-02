CREATE INDEX `cards_user_id_pay_date_idx` ON `cards` (`user_id`,`pay_date`);--> statement-breakpoint
CREATE INDEX `card_goal_allocations_goal_id_idx` ON `card_goal_allocations` (`goal_id`);--> statement-breakpoint
CREATE INDEX `goal_adjustments_goal_id_created_at_idx` ON `goal_adjustments` (`goal_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `savings_goals_user_id_created_at_idx` ON `savings_goals` (`user_id`,`created_at`);