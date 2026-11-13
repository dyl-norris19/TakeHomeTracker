import { eq, lt } from 'drizzle-orm';
import { db } from './db';
import { generateSessionToken, hashToken } from './auth';
import { passwordResetTokens } from './db/schema/password-reset-tokens';
import { sessions } from './db/schema/sessions';
import { users } from './db/schema/users';

export const RESET_TOKEN_MINUTES = 10;
const RESET_TOKEN_DURATION_MS = RESET_TOKEN_MINUTES * 60 * 1000;

/** Issues a reset token for the user and returns it, for the emailed link. */
export function createPasswordResetToken(userId: number): string {
    const now = Date.now();
    db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date(now))).run();

    const token = generateSessionToken();
    db.insert(passwordResetTokens)
        .values({
            id: hashToken(token),
            userId,
            expiresAt: new Date(now + RESET_TOKEN_DURATION_MS)
        })
        .run();

    return token;
}

export function isPasswordResetTokenValid(token: string): boolean {
    const row = db
        .select({ expiresAt: passwordResetTokens.expiresAt })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.id, hashToken(token)))
        .get();

    return row !== undefined && row.expiresAt.getTime() > Date.now();
}

/**
 * Sets a new password using a reset token. Also signs the account out
 * everywhere and voids its other reset links, so whoever knew the old password
 * (or holds another link) is cut off. Returns the account's email, or null if
 * the token is unknown or expired.
 */
export function resetPassword(token: string, passwordHash: string): string | null {
    return db.transaction((tx) => {
        const row = tx
            .select({
                userId: passwordResetTokens.userId,
                expiresAt: passwordResetTokens.expiresAt,
                email: users.email
            })
            .from(passwordResetTokens)
            .innerJoin(users, eq(passwordResetTokens.userId, users.id))
            .where(eq(passwordResetTokens.id, hashToken(token)))
            .get();

        if (!row || row.expiresAt.getTime() <= Date.now()) {
            return null;
        }

        tx.update(users).set({ passwordHash }).where(eq(users.id, row.userId)).run();
        tx.delete(sessions).where(eq(sessions.userId, row.userId)).run();
        tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId)).run();

        return row.email;
    });
}
