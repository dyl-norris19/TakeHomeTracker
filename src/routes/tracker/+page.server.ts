import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';
import { upsertPaydaySettings } from '$lib/server/db/commands/payday-settings';
import { getRecurringBills } from '$lib/server/db/queries/recurring-bills';
import { replaceRecurringBills } from '$lib/server/db/commands/recurring-bills';
import { getCardsByUser } from '$lib/server/db/queries/cards';
import { createCard } from '$lib/server/db/commands/cards';

function getNextPaydate(paydate: Date, frequency: number): Date {
    const today = new Date();

    if (frequency === 1) {
        let year = paydate.getFullYear();
        let month = paydate.getMonth();
        const day = paydate.getDate();

        while (true) {
            const nextDate = new Date(year, month, day);
            if (nextDate > today) {
                return nextDate;
            }
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }
    }

    const intervalDays = frequency === 2 ? 14 : 7;
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    let nextDate = new Date(paydate.getTime());
    while (nextDate <= today) {
        nextDate = new Date(nextDate.getTime() + intervalMs);
    }

    return nextDate;
}

function parseBills(raw: FormDataEntryValue | null): { name: string; amount: number }[] | null {
    let bills: unknown;
    try {
        bills = JSON.parse(String(raw));
    } catch {
        return null;
    }

    const isValid =
        Array.isArray(bills) &&
        bills.every(
            (bill) =>
                bill &&
                typeof bill.name === 'string' &&
                typeof bill.amount === 'number' &&
                !Number.isNaN(bill.amount)
        );

    return isValid ? (bills as { name: string; amount: number }[]) : null;
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(303, '/login');
    }

    return {
        email: locals.user.email,
        paydaySettings: await getPaydaySettings(locals.user.id),
        recurringBills: await getRecurringBills(locals.user.id),
        cards: await getCardsByUser(locals.user.id)
    };
};

export const actions: Actions = {
    updatePaydate: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const formData = await request.formData();
        const paydateSeconds = Number(formData.get('paydate'));
        const frequency = Number(formData.get('frequency'));

        if (!paydateSeconds || Number.isNaN(paydateSeconds) || !frequency || Number.isNaN(frequency)) {
            return fail(400, { paydateError: 'Pick a paydate and frequency.' });
        }

        await upsertPaydaySettings(locals.user.id, new Date(paydateSeconds * 1000), frequency);

        return { paydateSuccess: true };
    },

    updateRecurringBills: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const formData = await request.formData();
        const bills = parseBills(formData.get('bills'));

        if (!bills) {
            return fail(400, { billsError: 'Invalid bills data.' });
        }

        await replaceRecurringBills(locals.user.id, bills);

        return { billsSuccess: true };
    },

    createCard: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const paydaySettings = await getPaydaySettings(locals.user.id);
        if (!paydaySettings) {
            return fail(400, { cardError: 'Set your paydate before adding a card.' });
        }

        const formData = await request.formData();
        const month = String(formData.get('month') ?? '');
        const payAmount = Number(formData.get('payAmount'));
        const savingsTypeRaw = String(formData.get('savingsType') ?? '');
        const savingsMethod = savingsTypeRaw === '%' ? 'percent' : savingsTypeRaw === 'flat' ? 'flat' : null;
        const savingsAmount = Number(formData.get('savingsAmount'));
        const reoccurBills = parseBills(formData.get('reoccurBills'));
        const otherBills = parseBills(formData.get('otherBills'));

        if (
            !month ||
            Number.isNaN(payAmount) ||
            !savingsMethod ||
            Number.isNaN(savingsAmount) ||
            !reoccurBills ||
            !otherBills
        ) {
            return fail(400, { cardError: 'Please fill out all fields correctly.' });
        }

        const payDate = getNextPaydate(paydaySettings.paydate, paydaySettings.frequency);

        await createCard(locals.user.id, {
            month,
            payAmount,
            payDate,
            savings: { method: savingsMethod, amount: savingsAmount },
            reoccurBills,
            otherBills
        });

        return { cardSuccess: true };
    }
};
