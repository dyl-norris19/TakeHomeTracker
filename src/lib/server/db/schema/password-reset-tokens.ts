import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
    // SHA-256 of the token in the emailed link, like `sessions.id`; the token
    // itself is never stored.
    id: text('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});
