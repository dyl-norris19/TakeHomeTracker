import { error } from '@sveltejs/kit';
import { markTourCompleted } from '$lib/server/db/commands/users';
import type { RequestHandler } from './$types';

// Called by the intro tour when it finishes or is closed, so it stops auto-starting.
export const POST: RequestHandler = async ({ locals }) => {
    if (!locals.user) {
        error(401, 'Not logged in');
    }

    await markTourCompleted(locals.user.id);

    return new Response(null, { status: 204 });
};
