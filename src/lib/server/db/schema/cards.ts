import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const cards = sqliteTable('cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    month: text('month').notNull(),
    payAmount: real('pay_amount').notNull(),
    payDate: integer('pay_date', { mode: 'timestamp' }).notNull(),
    savingsMethod: text('savings_method', { enum: ['percent', 'flat'] }).notNull(),
    savingsAmount: real('savings_amount').notNull(),
    recurringBillsSnapshot: text('recurring_bills_snapshot').notNull(),
    otherBills: text('other_bills').notNull()
});
