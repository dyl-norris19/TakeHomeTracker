import { eq } from 'drizzle-orm';
import { db } from '../index';
import { paydaySettings } from '../schema/payday-settings';

export async function getPaydaySettings(userId: number) {
    const result = await db
        .select()
        .from(paydaySettings)
        .where(eq(paydaySettings.userId, userId));

    return result[0];
}
