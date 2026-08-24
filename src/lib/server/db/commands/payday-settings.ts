import { db } from '$lib/server/db/index';
import { paydaySettings } from '$lib/server/db/schema/payday-settings';

export async function upsertPaydaySettings(userId: number, paydate: Date, frequency: number) {
    const result = await db
        .insert(paydaySettings)
        .values({ userId, paydate, frequency })
        .onConflictDoUpdate({
            target: paydaySettings.userId,
            set: { paydate, frequency }
        })
        .returning();

    return result[0];
}
