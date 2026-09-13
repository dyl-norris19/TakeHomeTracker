import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';
import { upsertPaydaySettings } from '$lib/server/db/commands/payday-settings';
import { getRecurringBills } from '$lib/server/db/queries/recurring-bills';
import { replaceRecurringBills } from '$lib/server/db/commands/recurring-bills';
import { getCardsByUser } from '$lib/server/db/queries/cards';
import {
    createCard as insertCard,
    updateCard as updateCardRow,
    deleteCard as deleteCardRow
} from '$lib/server/db/commands/cards';
import { getFormString } from '$lib/server/form-data';
import { MONTHS, validateBills, validateCardForm, type CardFormValues } from '$lib/validation';
import { parsePercentToBasisPoints, parseToCents } from '$lib/money';
import { isMonthly, parseMonthValue, resolvePaydate, type PaydaySettings } from '$lib/paydates';

function parseSavingsMethod(raw: string): 'percent' | 'flat' | null {
    if (raw === '%') {
        return 'percent';
    }
    if (raw === 'flat') {
        return 'flat';
    }
    return null;
}

function parseBills(raw: FormDataEntryValue | null): { name: string; amountCents: number }[] | null {
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
                Number.isInteger(bill.amountCents)
        );

    return isValid ? (bills as { name: string; amountCents: number }[]) : null;
}

type ParsedCard =
    | { ok: true; values: CardFormValues; monthName: string; payDate: Date }
    | { ok: false; failure: ReturnType<typeof fail> };

function parseCardSubmission(formData: FormData, paydaySettings: PaydaySettings): ParsedCard {
    const parsedMonth = parseMonthValue(getFormString(formData, 'month') ?? '');
    const monthly = isMonthly(paydaySettings);
    const savingsMethod = parseSavingsMethod(getFormString(formData, 'savingsType') ?? '');
    const rawSavings = getFormString(formData, 'savingsAmount');
    const rawNotes = getFormString(formData, 'notes')?.trim() ?? '';
    const values: CardFormValues = {
        year: parsedMonth?.year ?? Number.NaN,
        monthIndex: parsedMonth?.monthIndex ?? Number.NaN,
        paycheckNumber: monthly ? 1 : Number(getFormString(formData, 'paycheckNumber')),
        payAmountCents: parseToCents(getFormString(formData, 'payAmount')),
        savingsMethod,
        savingsValue:
            savingsMethod === 'percent'
                ? parsePercentToBasisPoints(rawSavings)
                : parseToCents(rawSavings),
        reoccurBills: parseBills(formData.get('reoccurBills')),
        otherBills: parseBills(formData.get('otherBills')),
        notes: rawNotes || null
    };

    const cardFieldErrors = validateCardForm(values);
    if (Object.keys(cardFieldErrors).length > 0) {
        return {
            ok: false,
            failure: fail(400, { cardError: 'Please fix the highlighted fields.', cardFieldErrors })
        };
    }

    const payDate = resolvePaydate(
        paydaySettings,
        values.year,
        values.monthIndex,
        values.paycheckNumber
    );
    if (!payDate) {
        return {
            ok: false,
            failure: fail(400, {
                cardError: 'That paycheck doesn’t exist for the month you picked.',
                cardFieldErrors: { paycheckNumber: 'Pick a valid paycheck for this month.' }
            })
        };
    }

    return { ok: true, values, monthName: MONTHS[values.monthIndex], payDate };
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
        const parsed = parseCardSubmission(formData, paydaySettings);
        if (!parsed.ok) {
            return parsed.failure;
        }
        const { values, monthName, payDate } = parsed;
        const monthly = isMonthly(paydaySettings);

        const existingCards = await getCardsByUser(locals.user.id);
        const isDuplicate = existingCards.some(
            (card) =>
                card.year === values.year &&
                card.month === monthName &&
                card.paycheckNumber === values.paycheckNumber
        );
        if (isDuplicate && getFormString(formData, 'confirmDuplicate') !== 'true') {
            return fail(409, {
                cardError: monthly
                    ? `You already have a card for ${monthName} ${values.year}. Submit again to add another.`
                    : `You already have a card for ${monthName} ${values.year}, paycheck ${values.paycheckNumber}. Submit again to add another.`,
                cardDuplicate: true
            });
        }

        await insertCard(locals.user.id, {
            month: monthName,
            year: values.year,
            paycheckNumber: values.paycheckNumber,
            payAmountCents: values.payAmountCents,
            payDate,
            savings:
                values.savingsMethod === 'percent'
                    ? { method: 'percent', basisPoints: values.savingsValue }
                    : { method: 'flat', flatCents: values.savingsValue },
            reoccurBills: values.reoccurBills!,
            otherBills: values.otherBills!,
            notes: values.notes
        });

        return { cardSuccess: true };
    },

    updateCard: async ({ request, locals }) => {
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
        const cardId = Number(formData.get('cardId'));
        if (!cardId || Number.isNaN(cardId)) {
            return fail(400, { cardError: 'Invalid card.' });
        }

        const parsed = parseCardSubmission(formData, paydaySettings);
        if (!parsed.ok) {
            return parsed.failure;
        }
        const { values, monthName, payDate } = parsed;
        const monthly = isMonthly(paydaySettings);

        // A card colliding with the one being edited is expected — only warn when
        // the edit would land on top of a *different* existing card.
        const existingCards = await getCardsByUser(locals.user.id);
        const isDuplicate = existingCards.some(
            (card) =>
                card.id !== cardId &&
                card.year === values.year &&
                card.month === monthName &&
                card.paycheckNumber === values.paycheckNumber
        );
        if (isDuplicate && getFormString(formData, 'confirmDuplicate') !== 'true') {
            return fail(409, {
                cardError: monthly
                    ? `You already have another card for ${monthName} ${values.year}. Submit again to keep both.`
                    : `You already have another card for ${monthName} ${values.year}, paycheck ${values.paycheckNumber}. Submit again to keep both.`,
                cardDuplicate: true
            });
        }

        const updated = await updateCardRow(locals.user.id, cardId, {
            month: monthName,
            year: values.year,
            paycheckNumber: values.paycheckNumber,
            payAmountCents: values.payAmountCents,
            payDate,
            savings:
                values.savingsMethod === 'percent'
                    ? { method: 'percent', basisPoints: values.savingsValue }
                    : { method: 'flat', flatCents: values.savingsValue },
            reoccurBills: values.reoccurBills!,
            otherBills: values.otherBills!,
            notes: values.notes
        });
        if (!updated) {
            return fail(404, { cardError: 'Card not found.' });
        }

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

        const deleted = await deleteCardRow(locals.user.id, cardId);
        if (!deleted) {
            return fail(404, { cardError: 'Card not found.' });
        }

        return { cardDeleted: true };
    }
};
