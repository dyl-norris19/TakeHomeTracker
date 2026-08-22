import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from './db';
import { sessions } from './db/schema/sessions';
import { users } from './db/schema/users';

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_RENEWAL_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15;

export type Session = { id: string; userId: number; expiresAt: Date };
export type SessionUser = { id: number; email: string; firstName: string; lastName: string };

export function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, userId: number): Promise<Session> {
    const session: Session = {
        id: hashToken(token),
        userId,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS)
    };

    await db.insert(sessions).values(session);

    return session;
}

export async function validateSessionToken(
    token: string
): Promise<{ session: Session | null; user: SessionUser | null }> {
    const sessionId = hashToken(token);

    const result = await db
        .select({
            id: sessions.id,
            userId: sessions.userId,
            expiresAt: sessions.expiresAt,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.id, sessionId));

    if (result.length === 0) {
        return { session: null, user: null };
    }

    const row = result[0];
    const session: Session = { id: row.id, userId: row.userId, expiresAt: row.expiresAt };
    const user: SessionUser = {
        id: row.userId,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName
    };

    if (Date.now() >= session.expiresAt.getTime()) {
        await db.delete(sessions).where(eq(sessions.id, session.id));
        return { session: null, user: null };
    }

    if (Date.now() >= session.expiresAt.getTime() - SESSION_RENEWAL_THRESHOLD_MS) {
        session.expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
        await db.update(sessions).set({ expiresAt: session.expiresAt }).where(eq(sessions.id, session.id));
    }

    return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
    event.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        expires: expiresAt,
        path: '/'
    });
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
    event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export { SESSION_COOKIE_NAME };
