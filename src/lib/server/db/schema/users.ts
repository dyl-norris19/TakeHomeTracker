import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    // Set once the user finishes or closes the intro tour; null means it still auto-starts.
    tourCompletedAt: integer('tour_completed_at', { mode: 'timestamp' })
});