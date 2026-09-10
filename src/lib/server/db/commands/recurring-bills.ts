import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { recurringBills } from '$lib/server/db/schema/recurring-bills';

export async function replaceRecurringBills(
    userId: number,
    bills: { name: string; amountCents: number }[]
) {
    return db.transaction((tx) => {
        tx.delete(recurringBills).where(eq(recurringBills.userId, userId)).run();

        if (bills.length === 0) {
            return [];
        }

        return tx
            .insert(recurringBills)
            .values(bills.map((bill) => ({ userId, name: bill.name, amountCents: bill.amountCents })))
            .returning()
            .all();
    });
}
