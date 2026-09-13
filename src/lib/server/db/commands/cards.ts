import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { cards } from '$lib/server/db/schema/cards';
import type { CardBill, CardSavings } from '$lib/server/db/queries/cards';

export async function createCard(
    userId: number,
    data: {
        month: string;
        year: number;
        paycheckNumber: number;
        payAmountCents: number;
        payDate: Date;
        savings: CardSavings;
        reoccurBills: CardBill[];
        otherBills: CardBill[];
        notes: string | null;
    }
) {
    const result = await db
        .insert(cards)
        .values({
            userId,
            month: data.month,
            year: data.year,
            paycheckNumber: data.paycheckNumber,
            payAmountCents: data.payAmountCents,
            payDate: data.payDate,
            savingsMethod: data.savings.method,
            savingsFlatCents: data.savings.method === 'flat' ? data.savings.flatCents : null,
            savingsBasisPoints: data.savings.method === 'percent' ? data.savings.basisPoints : null,
            recurringBillsSnapshot: JSON.stringify(data.reoccurBills),
            otherBills: JSON.stringify(data.otherBills),
            notes: data.notes
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
