import { eq } from 'drizzle-orm';
import { db } from '../index';
import { cards } from '../schema/cards';
import { cardGoalAllocations } from '../schema/savings-goals';

export type CardBill = { name: string; amountCents: number };
export type CardSavings =
    | { method: 'flat'; flatCents: number }
    | { method: 'percent'; basisPoints: number };
export type CardGoalAllocation = { goalId: number; amountCents: number };

export type Card = {
    id: number;
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

export async function getCardsByUser(userId: number): Promise<Card[]> {
    const rows = await db.select().from(cards).where(eq(cards.userId, userId));

    const allocationRows = await db
        .select({
            cardId: cardGoalAllocations.cardId,
            goalId: cardGoalAllocations.goalId,
            amountCents: cardGoalAllocations.amountCents
        })
        .from(cardGoalAllocations)
        .innerJoin(cards, eq(cardGoalAllocations.cardId, cards.id))
        .where(eq(cards.userId, userId));

    const allocationsByCard = new Map<number, CardGoalAllocation[]>();
    for (const allocation of allocationRows) {
        const list = allocationsByCard.get(allocation.cardId) ?? [];
        list.push({ goalId: allocation.goalId, amountCents: allocation.amountCents });
        allocationsByCard.set(allocation.cardId, list);
    }

    return rows.map((row) => ({
        id: row.id,
        month: row.month,
        year: row.year,
        paycheckNumber: row.paycheckNumber,
        payAmountCents: row.payAmountCents,
        payDate: row.payDate,
        savings:
            row.savingsMethod === 'percent'
                ? { method: 'percent', basisPoints: row.savingsBasisPoints ?? 0 }
                : { method: 'flat', flatCents: row.savingsFlatCents ?? 0 },
        reoccurBills: JSON.parse(row.recurringBillsSnapshot) as CardBill[],
        otherBills: JSON.parse(row.otherBills) as CardBill[],
        goalAllocations: allocationsByCard.get(row.id) ?? [],
        notes: row.notes
    }));
}
