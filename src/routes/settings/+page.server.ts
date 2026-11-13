import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';
import { getRecurringBills } from '$lib/server/db/queries/recurring-bills';
import { upsertPaydaySettings, type PayScheduleRow } from '$lib/server/db/commands/payday-settings';
import { replaceRecurringBills } from '$lib/server/db/commands/recurring-bills';
import { getFormString } from '$lib/server/form-data';
import { validatePaySchedule, validateRecurringBills, type PayScheduleValues } from '$lib/validation';
import { ALLOCATIONS, AMOUNT_TYPES, type Allocation, type AmountType, type RecurringBill } from '$lib/bills';
import { parseToCents } from '$lib/money';
import { FREQUENCIES, WEEKEND_RULES, parseIsoDate, type Frequency, type WeekendRule } from '$lib/paydates';

function parseOption<T extends string>(options: readonly T[], raw: string | null): T | null {
    return options.includes(raw as T) ? (raw as T) : null;
}

function parseDay(raw: string | null): number | null {
    return raw ? Number(raw) : null;
}

/** Reads the form into values for {@link validatePaySchedule}. */
function parsePaySchedule(formData: FormData): PayScheduleValues {
    const anchorDate = getFormString(formData, 'anchorDate') ?? '';
    const takeHome = getFormString(formData, 'takeHome')?.trim() ?? '';
    return {
        frequency: parseOption<Frequency>(FREQUENCIES, getFormString(formData, 'frequency')),
        // Drop impossible dates like 2026-02-30 so they fail validation.
        anchorDate: parseIsoDate(anchorDate) ? anchorDate : null,
        payDay1: parseDay(getFormString(formData, 'payDay1')),
        payDay2: parseDay(getFormString(formData, 'payDay2')),
        weekendRule: parseOption<WeekendRule>(WEEKEND_RULES, getFormString(formData, 'weekendRule')),
        takeHomeCents: takeHome ? parseToCents(takeHome) : null
    };
}

/**
 * Keeps only the fields the frequency uses, so stale values from another
 * frequency (e.g. an anchor left over after switching to monthly) aren't saved.
 * Only call after validation has passed.
 */
function toRow(values: PayScheduleValues): PayScheduleRow {
    const frequency = values.frequency!;
    const stepped = frequency === 'weekly' || frequency === 'biweekly';
    const days = [values.payDay1!, values.payDay2!].sort((a, b) => a - b);
    let payDay1: number | null = null;
    if (frequency === 'monthly') {
        payDay1 = values.payDay1;
    } else if (frequency === 'semimonthly') {
        payDay1 = days[0];
    }
    return {
        frequency,
        anchorDate: stepped ? values.anchorDate : null,
        payDay1,
        payDay2: frequency === 'semimonthly' ? days[1] : null,
        // Unused by weekly / biweekly, but kept so switching back remembers it.
        weekendRule: values.weekendRule ?? 'none',
        takeHomeCents: values.takeHomeCents
    };
}

function nullableInt(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
}

/**
 * Reads the `bills` JSON field. Returns null if it isn't a list of objects;
 * fields with the wrong type come back null (or as an unknown option) so
 * {@link validateRecurringBills} reports them.
 */
function parseRecurringBills(raw: string | null): RecurringBill[] | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw ?? '');
    } catch {
        return null;
    }
    if (!Array.isArray(parsed) || !parsed.every((bill) => bill && typeof bill === 'object')) {
        return null;
    }
    return parsed.map((bill) => ({
        name: typeof bill.name === 'string' ? bill.name : '',
        amountType: parseOption<AmountType>(AMOUNT_TYPES, bill.amountType) ?? 'flat',
        amountCents: nullableInt(bill.amountCents),
        basisPoints: nullableInt(bill.basisPoints),
        allocation: parseOption<Allocation>(ALLOCATIONS, bill.allocation) ?? 'split',
        dueDay: nullableInt(bill.dueDay)
    }));
}

/** Keeps only the fields each bill's type uses. Only call after validation. */
function toBillRow(bill: RecurringBill): RecurringBill {
    const percent = bill.amountType === 'percent';
    return {
        name: bill.name.trim(),
        amountType: bill.amountType,
        amountCents: percent ? null : bill.amountCents,
        basisPoints: percent ? bill.basisPoints : null,
        // Percent bills are on every paycheck, which is what `split` means here.
        allocation: percent ? 'split' : bill.allocation,
        dueDay: !percent && bill.allocation === 'single' ? bill.dueDay : null
    };
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(303, '/login');
    }

    return {
        paydaySettings: await getPaydaySettings(locals.user.id),
        recurringBills: await getRecurringBills(locals.user.id)
    };
};

export const actions: Actions = {
    updatePaySchedule: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const values = parsePaySchedule(await request.formData());
        const payScheduleError = validatePaySchedule(values);
        if (payScheduleError) {
            return fail(400, { payScheduleError });
        }

        await upsertPaydaySettings(locals.user.id, toRow(values));

        return { payScheduleSuccess: true };
    },

    updateRecurringBills: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401);
        }

        const bills = parseRecurringBills(getFormString(await request.formData(), 'bills'));
        const billsError = validateRecurringBills(bills);
        if (billsError) {
            return fail(400, { billsError });
        }

        await replaceRecurringBills(locals.user.id, bills!.map(toBillRow));

        return { billsSuccess: true };
    }
};
