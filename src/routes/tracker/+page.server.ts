import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';
import { upsertPaydaySettings } from '$lib/server/db/commands/payday-settings';
import { getRecurringBills } from '$lib/server/db/queries/recurring-bills';
import { replaceRecurringBills } from '$lib/server/db/commands/recurring-bills';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(303, '/login');
    }

    return {
        email: locals.user.email,
        paydaySettings: await getPaydaySettings(locals.user.id),
        recurringBills: await getRecurringBills(locals.user.id)
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

        let bills: { name: string; amount: number }[];
        try {
            bills = JSON.parse(String(formData.get('bills')));
        } catch {
            return fail(400, { billsError: 'Invalid bills data.' });
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

        if (!isValid) {
            return fail(400, { billsError: 'Invalid bills data.' });
        }

        await replaceRecurringBills(locals.user.id, bills);

        return { billsSuccess: true };
    }
};
