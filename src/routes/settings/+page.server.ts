import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';
import { upsertPaydaySettings, type PayScheduleRow } from '$lib/server/db/commands/payday-settings';
import { getFormString } from '$lib/server/form-data';
import { validatePaySchedule, type PayScheduleValues } from '$lib/validation';
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
    return {
        frequency,
        anchorDate: stepped ? values.anchorDate : null,
        payDay1: stepped ? null : frequency === 'monthly' ? values.payDay1 : days[0],
        payDay2: frequency === 'semimonthly' ? days[1] : null,
        // Unused by weekly / biweekly, but kept so switching back remembers it.
        weekendRule: values.weekendRule ?? 'none',
        takeHomeCents: values.takeHomeCents
    };
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(303, '/login');
    }

    return {
        paydaySettings: await getPaydaySettings(locals.user.id)
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
    }
};
