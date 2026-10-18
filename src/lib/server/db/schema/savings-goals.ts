import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { cards } from './cards';

export const savingsGoals = sqliteTable('savings_goals', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    targetCents: integer('target_cents').notNull(),
    startingCents: integer('starting_cents').notNull().default(0),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

/**
 * Money moved into or out of a goal from something other than a paycheck — a tax
 * refund, a settlement, or pulling some back out for an emergency. Append-only
 * history rather than a mutable total, so the note explaining each one survives.
 */
export const goalAdjustments = sqliteTable('goal_adjustments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    goalId: integer('goal_id').notNull().references(() => savingsGoals.id),
    // Signed: a negative amount is money taken back out.
    amountCents: integer('amount_cents').notNull(),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const cardGoalAllocations = sqliteTable(
    'card_goal_allocations',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        cardId: integer('card_id').notNull().references(() => cards.id),
        goalId: integer('goal_id').notNull().references(() => savingsGoals.id),
        amountCents: integer('amount_cents').notNull()
    },
    (table) => [unique().on(table.cardId, table.goalId)]
);
