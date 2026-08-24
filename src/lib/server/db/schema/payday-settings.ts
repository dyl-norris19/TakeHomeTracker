import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const paydaySettings = sqliteTable('payday_settings', {
    userId: integer('user_id').primaryKey().references(() => users.id),
    paydate: integer('paydate', { mode: 'timestamp' }).notNull(),
    frequency: integer('frequency').notNull()
});
