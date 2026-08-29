import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import {
    SESSION_COOKIE_NAME,
    validateSessionToken,
    setSessionTokenCookie,
    deleteSessionTokenCookie
} from '$lib/server/auth';
import { runMigrations } from '$lib/server/db/migrate';

// Migrate on startup, for both dev and prod. Skipped during `vite build`, which
// imports server modules to analyse routes but must not touch the database.
if (!building) {
    runMigrations();
}

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get(SESSION_COOKIE_NAME);

    if (!token) {
        event.locals.user = null;
        event.locals.session = null;
        return resolve(event);
    }

    const { session, user } = await validateSessionToken(token);

    if (session) {
        setSessionTokenCookie(event, token, session.expiresAt);
    } else {
        deleteSessionTokenCookie(event);
    }

    event.locals.user = user;
    event.locals.session = session;

    return resolve(event);
};
