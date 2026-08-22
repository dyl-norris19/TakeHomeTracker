// @ts-nocheck
import type { Actions } from './$types';
import { signupUser } from '$lib/server/db/commands/users';

export const actions = {
    default: async ({ request }: import('./$types').RequestEvent) => {
        const formData = await request.formData();
    }
}
;null as any as Actions;