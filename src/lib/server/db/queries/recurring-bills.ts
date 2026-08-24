import { eq } from 'drizzle-orm';
import { db } from '../index';
import { recurringBills } from '../schema/recurring-bills';

export async function getRecurringBills(userId: number) {
    return db.select().from(recurringBills).where(eq(recurringBills.userId, userId));
}
