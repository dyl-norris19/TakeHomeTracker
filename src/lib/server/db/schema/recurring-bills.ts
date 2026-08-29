import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const recurringBills = sqliteTable('recurring_bills', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    amount: real('amount').notNull()
});
