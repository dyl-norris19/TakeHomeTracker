import { desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { cards } from '../schema/cards';
import { cardGoalAllocations } from '../schema/savings-goals';
import type { CardBudget } from '$lib/money';

// `dueDate` (YYYY-MM-DD) is only on recurring bills that had one when the card
// was made; older cards and other bills don't have it.
export type CardBill = { name: string; amountCents: number; dueDate?: string | null };
export type CardGoalAllocation = { goalId: number; amountCents: number };

export type Card = {
    id: number;
    month: string;
    year: number;
    paycheckNumber: number;
    payAmountCents: number;
    payDate: Date;
    budget: CardBudget;
    reoccurBills: CardBill[];
    otherBills: CardBill[];
    goalAllocations: CardGoalAllocation[];
    notes: string | null;
};

export async function getCardsByUser(userId: number): Promise<Card[]> {
    const rows = await db
        .select()
        .from(cards)
        .where(eq(cards.userId, userId))
        .orderBy(desc(cards.payDate), desc(cards.id));

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
        budget:
            row.budgetMethod === 'percent'
                ? { mode: row.budgetMode, method: 'percent', basisPoints: row.budgetBasisPoints ?? 0 }
                : { mode: row.budgetMode, method: 'flat', flatCents: row.budgetFlatCents ?? 0 },
        reoccurBills: JSON.parse(row.recurringBillsSnapshot) as CardBill[],
        otherBills: JSON.parse(row.otherBills) as CardBill[],
        goalAllocations: allocationsByCard.get(row.id) ?? [],
        notes: row.notes
    }));
}
