import type { Actions } from './$types';
import { signupUser } from '$lib/server/db/commands/users';

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
    }
}
