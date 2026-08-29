import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { cards } from '$lib/server/db/schema/cards';
import type { CardBill, CardSavings } from '$lib/server/db/queries/cards';

export async function createCard(
    userId: number,
    data: {
        month: string;
        payAmount: number;
        payDate: Date;
        savings: CardSavings;
        reoccurBills: CardBill[];
        otherBills: CardBill[];
    }
) {
    const result = await db
        .insert(cards)
        .values({
            userId,
            month: data.month,
            payAmount: data.payAmount,
            payDate: data.payDate,
            savingsMethod: data.savings.method,
            savingsAmount: data.savings.amount,
            recurringBillsSnapshot: JSON.stringify(data.reoccurBills),
            otherBills: JSON.stringify(data.otherBills)
        })
        .returning();

    return result[0];
}

export async function deleteCard(userId: number, cardId: number) {
    const result = await db
        .delete(cards)
        .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
        .returning();

    return result[0];
}
