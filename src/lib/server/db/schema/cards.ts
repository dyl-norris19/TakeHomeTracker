import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const cards = sqliteTable('cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    month: text('month').notNull(),
    // `year` + `paycheckNumber` identify which paycheck the card is for. The
    // defaults only exist so the columns can be added to a table that already
    // holds rows; application code always sets both explicitly.
    year: integer('year').notNull().default(0),
    paycheckNumber: integer('paycheck_number').notNull().default(1),
    payAmount: real('pay_amount').notNull(),
    payDate: integer('pay_date', { mode: 'timestamp' }).notNull(),
    savingsMethod: text('savings_method', { enum: ['percent', 'flat'] }).notNull(),
    savingsAmount: real('savings_amount').notNull(),
    recurringBillsSnapshot: text('recurring_bills_snapshot').notNull(),
    otherBills: text('other_bills').notNull()
});
