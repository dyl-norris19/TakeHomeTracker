import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Prototype: load only. Saving is simulated on the client until the schema
// grows the new fields (semi-monthly days, default take-home, bill due day, etc.).
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(303, '/login');
    }
};
