import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPaydaySettings } from '$lib/server/db/queries/payday-settings';

// Prototype: load only. Saving is simulated on the client until the schema
// grows the new fields (semi-monthly days, default take-home, bill due day, etc.).
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(303, '/login');
    }

    return {
        paydaySettings: await getPaydaySettings(locals.user.id)
    };
};
