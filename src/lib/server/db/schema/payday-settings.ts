import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// Mirrors FREQUENCIES / WEEKEND_RULES in src/lib/paydates.ts. Inlined because
// drizzle-kit loads this file outside Vite, where `$lib` doesn't resolve.
export const paydaySettings = sqliteTable('payday_settings', {
    userId: integer('user_id').primaryKey().references(() => users.id),
    frequency: text('frequency', { enum: ['weekly', 'biweekly', 'semimonthly', 'monthly'] }).notNull(),
    // A known payday as a `YYYY-MM-DD` calendar date (no timezone). Set for
    // weekly / biweekly only.
    anchorDate: text('anchor_date'),
    // Day of the month (1-31, clamped to the month's last day). `payDay1` is set
    // for monthly and semimonthly; `payDay2` (> payDay1) for semimonthly only.
    payDay1: integer('pay_day_1'),
    payDay2: integer('pay_day_2'),
    // Where a monthly / semimonthly payday moves when it lands on a weekend.
    weekendRule: text('weekend_rule', { enum: ['before', 'after', 'none'] }).notNull().default('none'),
    // Usual paycheck after tax, used to prefill new cards. Null when not set.
    takeHomeCents: integer('take_home_cents')
});
