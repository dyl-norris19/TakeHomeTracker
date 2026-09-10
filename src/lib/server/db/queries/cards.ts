import { eq } from 'drizzle-orm';
import { db } from '../index';
import { cards } from '../schema/cards';

export type CardBill = { name: string; amountCents: number };
export type CardSavings =
    | { method: 'flat'; flatCents: number }
    | { method: 'percent'; basisPoints: number };

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
};

export async function getCardsByUser(userId: number): Promise<Card[]> {
    const rows = await db.select().from(cards).where(eq(cards.userId, userId));

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
        otherBills: JSON.parse(row.otherBills) as CardBill[]
    }));
}
