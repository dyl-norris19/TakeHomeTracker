import { eq } from 'drizzle-orm';
import { db } from '../index';
import { users } from '../schema/users';

export async function getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));

    return result[0];
}