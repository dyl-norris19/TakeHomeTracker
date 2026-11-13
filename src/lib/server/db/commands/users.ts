import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema/users';

//signupUser

export async function signupUser(
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string
) {
    const result = await db.insert(users).values({
        email, 
        passwordHash, 
        firstName, 
        lastName
    }).returning();

    return result[0];
}

export async function markTourCompleted(userId: number) {
    await db.update(users).set({ tourCompletedAt: new Date() }).where(eq(users.id, userId));
}
