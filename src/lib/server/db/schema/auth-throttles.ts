import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Failed-attempt counters and lockouts for auth endpoints, one row per thing
 * being limited (e.g. `login:email:<email>` or `login:ip:<address>`). Keyed by a
 * plain string rather than hung off `users` so an email with no account is
 * throttled exactly like a real one.
 */
export const authThrottles = sqliteTable('auth_throttles', {
    key: text('key').primaryKey(),
    // Attempts counted in the current window.
    failCount: integer('fail_count').notNull().default(0),
    windowStartedAt: integer('window_started_at', { mode: 'timestamp' }).notNull(),
    lockedUntil: integer('locked_until', { mode: 'timestamp' }),
    // How many times this key has been locked; picks the next lock's length.
    strikes: integer('strikes').notNull().default(0),
    lastLockedAt: integer('last_locked_at', { mode: 'timestamp' })
});
