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
