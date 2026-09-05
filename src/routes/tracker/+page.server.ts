import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';
import { upsertPaydaySettings } from '$lib/server/db/commands/payday-settings';
import { getRecurringBills } from '$lib/server/db/queries/recurring-bills';
import { replaceRecurringBills } from '$lib/server/db/commands/recurring-bills';
import { getCardsByUser } from '$lib/server/db/queries/cards';
import { createCard, deleteCard } from '$lib/server/db/commands/cards';
import { getFormString } from '$lib/server/form-data';
import { parseAmount, validateBills, validateCardForm, type CardFormValues } from '$lib/validation';

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

    let nextDate = new Date(paydate);
    while (nextDate <= today) {
        nextDate = new Date(nextDate.getTime() + intervalMs);
    }

    return nextDate;
}

function parseSavingsMethod(raw: string): 'percent' | 'flat' | null {
    if (raw === '%') {
        return 'percent';
    }
    if (raw === 'flat') {
        return 'flat';
    }
    return null;
}

function parseBills(raw: FormDataEntryValue | null): { name: string; amount: number }[] | null {
    if (typeof raw !== 'string') {
        return null;
    }

    let bills: unknown;
    try {
        bills = JSON.parse(raw);
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

        if (!paydateSeconds || Number.isNaN(paydateSeconds)) {
            return fail(400, { paydateError: 'Pick your paydate.' });
        }
        if (![1, 2, 4].includes(frequency)) {
            return fail(400, { paydateError: 'Choose how often you get paid.' });
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

        const billsError = validateBills(bills, 'bills');
        if (billsError) {
            return fail(400, { billsError });
        }

        await replaceRecurringBills(locals.user.id, bills!);

        return { billsSuccess: true };
    },

    createCard: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const paydaySettings = await getPaydaySettings(locals.user.id);
        if (!paydaySettings) {
            return fail(400, {
                cardError: 'Set your paydate first.'
            });
        }

        const formData = await request.formData();
        const values: CardFormValues = {
            month: getFormString(formData, 'month')?.trim() ?? '',
            payAmount: parseAmount(getFormString(formData, 'payAmount')),
            savingsMethod: parseSavingsMethod(getFormString(formData, 'savingsType') ?? ''),
            savingsAmount: parseAmount(getFormString(formData, 'savingsAmount')),
            reoccurBills: parseBills(formData.get('reoccurBills')),
            otherBills: parseBills(formData.get('otherBills'))
        };

        const cardFieldErrors = validateCardForm(values);
        if (Object.keys(cardFieldErrors).length > 0) {
            return fail(400, { cardError: 'Please fix the highlighted fields.', cardFieldErrors });
        }

        const payDate = getNextPaydate(paydaySettings.paydate, paydaySettings.frequency);

        await createCard(locals.user.id, {
            month: values.month,
            payAmount: values.payAmount,
            payDate,
            savings: { method: values.savingsMethod!, amount: values.savingsAmount },
            reoccurBills: values.reoccurBills!,
            otherBills: values.otherBills!
        });

        return { cardSuccess: true };
    },

    deleteCard: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const formData = await request.formData();
        const cardId = Number(formData.get('cardId'));

        if (!cardId || Number.isNaN(cardId)) {
            return fail(400, { cardError: 'Invalid card.' });
        }

        const deleted = await deleteCard(locals.user.id, cardId);
        if (!deleted) {
            return fail(404, { cardError: 'Card not found.' });
        }

        return { cardDeleted: true };
    }
};
