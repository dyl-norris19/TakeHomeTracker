import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '$env/dynamic/private';

// Configurable so prod can point at the mounted volume (see docker-compose.yml).
// Defaults to a repo-local file for dev.
const dbPath = resolve(env.DATABASE_PATH ?? 'data/data.sqlite');

mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite);
