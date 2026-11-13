import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { recurringBills } from '$lib/server/db/schema/recurring-bills';
import type { RecurringBill } from '$lib/bills';

export async function replaceRecurringBills(userId: number, bills: RecurringBill[]) {
    return db.transaction((tx) => {
        tx.delete(recurringBills).where(eq(recurringBills.userId, userId)).run();

        if (bills.length === 0) {
            return [];
        }

        return tx
            .insert(recurringBills)
            .values(bills.map((bill) => ({ userId, ...bill })))
            .returning()
            .all();
    });
}
