import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { getUserByEmail } from '$lib/server/db/queries/users';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export const actions: Actions = {
    default: async (event) => {
        const { request } = event;
        const formData = await request.formData();

        const email = formData.get('email')?.toString().trim().toLowerCase();
        const password = formData.get('password')?.toString();

        if (!email || !password) {
            return fail(400, { error: 'Email and password are required.', email });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return fail(401, { error: 'Invalid email or password.', email });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return fail(401, { error: 'Invalid email or password.', email });
        }

        const token = generateSessionToken();
        const session = await createSession(token, user.id);
        setSessionTokenCookie(event, token, session.expiresAt);

        redirect(303, '/tracker');
    }
};
