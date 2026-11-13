CREATE TABLE `auth_throttles` (
	`key` text PRIMARY KEY NOT NULL,
	`fail_count` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`locked_until` integer,
	`strikes` integer DEFAULT 0 NOT NULL,
	`last_locked_at` integer
);
