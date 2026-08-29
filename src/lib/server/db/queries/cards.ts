import { eq } from 'drizzle-orm';
import { db } from '../index';
import { cards } from '../schema/cards';

export type CardBill = { name: string; amount: number };
export type CardSavings = { method: 'percent' | 'flat'; amount: number };

export type Card = {
    id: number;
    month: string;
    payAmount: number;
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
        payAmount: row.payAmount,
        payDate: row.payDate,
        savings: { method: row.savingsMethod, amount: row.savingsAmount },
        reoccurBills: JSON.parse(row.recurringBillsSnapshot) as CardBill[],
        otherBills: JSON.parse(row.otherBills) as CardBill[]
    }));
}
