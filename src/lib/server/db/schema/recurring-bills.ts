import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// Mirrors the types in src/lib/bills.ts. Inlined because drizzle-kit loads this
// file outside Vite, where `$lib` doesn't resolve.
export const recurringBills = sqliteTable('recurring_bills', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    amountType: text('amount_type', { enum: ['flat', 'percent'] }).notNull().default('flat'),
    // Flat bills: integer cents (see src/lib/money.ts). For a split bill this is
    // the monthly total, divided across a normal month's paychecks.
    amountCents: integer('amount_cents'),
    // Percent bills: basis points of each card's pay amount (15% -> 1500).
    basisPoints: integer('basis_points'),
    // Flat bills only: `single` lands on the paycheck covering `dueDay`;
    // `split` puts an equal share on every paycheck.
    allocation: text('allocation', { enum: ['single', 'split'] }).notNull().default('split'),
    // Day of the month (1-31) a single bill is due. Null otherwise.
    dueDay: integer('due_day')
});
