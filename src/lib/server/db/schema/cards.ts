import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
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
    // Money is stored as integer cents — see src/lib/money.ts.
    payAmountCents: integer('pay_amount_cents').notNull(),
    payDate: integer('pay_date', { mode: 'timestamp' }).notNull(),
    savingsMethod: text('savings_method', { enum: ['percent', 'flat'] }).notNull(),
    // Exactly one of these is set, picked by `savingsMethod`: a flat amount in
    // cents, or a percentage in basis points (hundredths of a percent).
    savingsFlatCents: integer('savings_flat_cents'),
    savingsBasisPoints: integer('savings_basis_points'),
    recurringBillsSnapshot: text('recurring_bills_snapshot').notNull(),
    otherBills: text('other_bills').notNull()
});
