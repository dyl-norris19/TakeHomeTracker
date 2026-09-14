import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { cards } from '$lib/server/db/schema/cards';
import { cardGoalAllocations } from '$lib/server/db/schema/savings-goals';
import type { CardBill, CardGoalAllocation, CardSavings } from '$lib/server/db/queries/cards';

export type CardWriteData = {
    month: string;
    year: number;
    paycheckNumber: number;
    payAmountCents: number;
    payDate: Date;
    savings: CardSavings;
    reoccurBills: CardBill[];
    otherBills: CardBill[];
    goalAllocations: CardGoalAllocation[];
    notes: string | null;
};

function cardColumns(data: CardWriteData) {
    return {
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
    };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Replaces a card's goal allocations wholesale; zero amounts aren't stored.
function writeAllocations(tx: Tx, cardId: number, allocations: CardGoalAllocation[]) {
    tx.delete(cardGoalAllocations).where(eq(cardGoalAllocations.cardId, cardId)).run();

    const rows = allocations
        .filter((allocation) => allocation.amountCents > 0)
        .map((allocation) => ({
            cardId,
            goalId: allocation.goalId,
            amountCents: allocation.amountCents
        }));
    if (rows.length > 0) {
        tx.insert(cardGoalAllocations).values(rows).run();
    }
}

export async function createCard(userId: number, data: CardWriteData) {
    return db.transaction((tx) => {
        const card = tx
            .insert(cards)
            .values({ userId, ...cardColumns(data) })
            .returning()
            .get();

        writeAllocations(tx, card.id, data.goalAllocations);

        return card;
    });
}

export async function updateCard(userId: number, cardId: number, data: CardWriteData) {
    return db.transaction((tx) => {
        const card = tx
            .update(cards)
            .set(cardColumns(data))
            .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
            .returning()
            .get();

        if (card) {
            writeAllocations(tx, card.id, data.goalAllocations);
        }

        return card;
    });
}

export async function deleteCard(userId: number, cardId: number) {
    return db.transaction((tx) => {
        const card = tx
            .select({ id: cards.id })
            .from(cards)
            .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
            .get();
        if (!card) {
            return undefined;
        }

        tx.delete(cardGoalAllocations).where(eq(cardGoalAllocations.cardId, card.id)).run();

        return tx.delete(cards).where(eq(cards.id, card.id)).returning().get();
    });
}
