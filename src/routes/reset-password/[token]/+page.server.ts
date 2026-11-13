import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import type { Actions, PageServerLoad } from './$types';
import { getFormString } from '$lib/server/form-data';
import { isPasswordResetTokenValid, resetPassword } from '$lib/server/password-reset';
import { clearThrottle, loginEmailKey } from '$lib/server/throttle';
import { passwordError } from '$lib/validation';

const INVALID_LINK = 'This reset link is invalid or has expired. Request a new one.';

export const load: PageServerLoad = ({ params, setHeaders }) => {
    // The token is in the URL; keep it out of Referer headers on any outbound request.
    setHeaders({ 'Referrer-Policy': 'no-referrer' });

    return { valid: isPasswordResetTokenValid(params.token) };
};

export const actions: Actions = {
    default: async ({ request, params }) => {
        const formData = await request.formData();
        const password = getFormString(formData, 'password');
        const confirmPassword = getFormString(formData, 'confirmPassword');

        if (!isPasswordResetTokenValid(params.token)) {
            return fail(400, { error: INVALID_LINK });
        }
        if (!password) {
            return fail(400, { error: 'Enter a new password.' });
        }
        const passwordProblem = passwordError(password);
        if (passwordProblem) {
            return fail(400, { error: passwordProblem });
        }
        if (!confirmPassword) {
            return fail(400, { error: 'Enter your password again to confirm it.' });
        }
        if (password !== confirmPassword) {
            return fail(400, { error: 'The two passwords do not match.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const email = resetPassword(params.token, passwordHash);
        if (!email) {
            return fail(400, { error: INVALID_LINK });
        }

        // Proving control of the inbox lifts any login lockout on the account.
        clearThrottle(loginEmailKey(email));

        redirect(303, '/login?reset');
    }
};
