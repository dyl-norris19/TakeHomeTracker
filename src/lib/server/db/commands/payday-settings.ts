import { db } from '$lib/server/db/index';
import { paydaySettings } from '$lib/server/db/schema/payday-settings';
import type { PaydaySettings } from '$lib/paydates';

export type PayScheduleRow = PaydaySettings & { takeHomeCents: number | null };

export async function upsertPaydaySettings(userId: number, schedule: PayScheduleRow) {
    const result = await db
        .insert(paydaySettings)
        .values({ userId, ...schedule })
        .onConflictDoUpdate({
            target: paydaySettings.userId,
            set: schedule
        })
        .returning();

    return result[0];
}
