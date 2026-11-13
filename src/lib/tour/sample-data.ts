// Made-up data the intro tour shows wherever the user has nothing of their own
// yet, so every step has something to point at. It only ever exists in the
// browser: nothing here is saved, and it disappears when the tour ends.

import { MONTHS } from '$lib/validation';
import { toIsoDate, type PaydaySettings } from '$lib/paydates';
import type { RecurringBill } from '$lib/bills';
import type { Card } from '$lib/server/db/queries/cards';
import type { Goal } from '$lib/server/db/queries/savings-goals';

const SAMPLE_GOAL_ID = -1;

/** The most recent Friday, today included. */
function lastFriday(): Date {
    const date = new Date();
    date.setDate(date.getDate() - ((date.getDay() + 2) % 7));
    return date;
}

/** Paid every other Friday, $2,000 a paycheck. */
export function samplePaySchedule(): PaydaySettings & { takeHomeCents: number | null } {
    return {
        frequency: 'biweekly',
        anchorDate: toIsoDate(lastFriday()),
        payDay1: null,
        payDay2: null,
        weekendRule: 'none',
        takeHomeCents: 200000
    };
}

/** One of each kind: split across paychecks, due on a day, and a percent of pay. */
export function sampleRecurringBills(): RecurringBill[] {
    return [
        { name: 'Rent', amountType: 'flat', amountCents: 120000, basisPoints: null, allocation: 'split', dueDay: null },
        { name: 'Phone', amountType: 'flat', amountCents: 6000, basisPoints: null, allocation: 'single', dueDay: 15 },
        { name: 'Retirement', amountType: 'percent', amountCents: null, basisPoints: 500, allocation: 'split', dueDay: null }
    ];
}

export function sampleGoal(): Goal {
    return {
        id: SAMPLE_GOAL_ID,
        name: 'Vacation (example)',
        targetCents: 200000,
        startingCents: 50000,
        // The starting amount plus the $100 the sample card puts toward it.
        savedCents: 60000,
        adjustments: [],
        hasCardAllocations: true,
        completedAt: null
    };
}

/**
 * $2,000 pay, less $700 recurring and $150 other bills, saving 20% ($400, of
 * which $100 goes to the sample goal), leaves $750 take home.
 */
export function sampleCard(): Card {
    const payDate = lastFriday();

    return {
        id: -1,
        month: MONTHS[payDate.getMonth()],
        year: payDate.getFullYear(),
        paycheckNumber: 1,
        payAmountCents: 200000,
        payDate,
        budget: { mode: 'splurge', method: 'percent', basisPoints: 2000 },
        reoccurBills: [
            { name: 'Rent', amountCents: 60000 },
            { name: 'Retirement', amountCents: 10000 }
        ],
        otherBills: [{ name: 'Groceries', amountCents: 15000 }],
        goalAllocations: [{ goalId: SAMPLE_GOAL_ID, amountCents: 10000 }],
        notes: null
    };
}

/** Example values the tour fills the New Card form with. Same numbers as {@link sampleCard}. */
export type SampleCardForm = {
    payAmount: string;
    otherBills: { name: string; amount: string }[];
    budgetType: '%' | 'flat';
    budgetAmount: string;
    /** Put toward the first goal in the list. */
    goalAmount: string;
};

export function sampleCardForm(): SampleCardForm {
    return {
        payAmount: '2000.00',
        otherBills: [{ name: 'Groceries', amount: '150.00' }],
        budgetType: '%',
        budgetAmount: '20',
        goalAmount: '100.00'
    };
}
