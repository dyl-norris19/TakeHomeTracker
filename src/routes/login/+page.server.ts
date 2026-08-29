import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { getUserByEmail } from '$lib/server/db/queries/users';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { getFormString } from '$lib/server/form-data';
import { isValidEmail } from '$lib/validation';

export const actions: Actions = {
    default: async (event) => {
        const { request } = event;
        const formData = await request.formData();

        const email = getFormString(formData, 'email')?.trim().toLowerCase();
        const password = getFormString(formData, 'password');

        if (!email && !password) {
            return fail(400, { error: 'Enter your email and password.', email });
        }
        if (!email) {
            return fail(400, { error: 'Enter your email address.', email });
        }
        if (!password) {
            return fail(400, { error: 'Enter your password.', email });
        }

        if (!isValidEmail(email)) {
            return fail(400, { error: 'Please enter a valid email address.', email });
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
