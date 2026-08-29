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