import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'node:path';
import { db } from './index';

// Runs pending migrations against the current database. Called once at server
// startup (dev and prod) from hooks.server.ts.
export function runMigrations() {
    migrate(db, { migrationsFolder: resolve('drizzle') });
}
