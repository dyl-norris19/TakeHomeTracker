import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { signupUser } from '$lib/server/db/commands/users';
import { getUserByEmail } from '$lib/server/db/queries/users';
import { getFormString } from '$lib/server/form-data';
import { isValidEmail } from '$lib/validation';

export const actions: Actions = {
    default: async ({ request }) => {
        const formData = await request.formData();

        const email = getFormString(formData, 'email')?.trim().toLowerCase();
        const password = getFormString(formData, 'password');
        const confirmPassword = getFormString(formData, 'confirmPassword');
        const firstName = getFormString(formData, 'firstname')?.trim();
        const lastName = getFormString(formData, 'lastname')?.trim();

        if (!firstName) {
            return fail(400, { error: 'Enter your first name.', email, firstName, lastName });
        }
        if (!lastName) {
            return fail(400, { error: 'Enter your last name.', email, firstName, lastName });
        }
        if (!email) {
            return fail(400, { error: 'Enter your email address.', email, firstName, lastName });
        }
        if (!isValidEmail(email)) {
            return fail(400, { error: 'Please enter a valid email address.', email, firstName, lastName });
        }
        if (!password) {
            return fail(400, { error: 'Enter a password.', email, firstName, lastName });
        }
        if (!confirmPassword) {
            return fail(400, { error: 'Enter your password again to confirm it.', email, firstName, lastName });
        }
        if (password !== confirmPassword) {
            return fail(400, { error: 'The two passwords do not match.', email, firstName, lastName });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return fail(400, { error: 'An account with that email already exists.', email, firstName, lastName });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        try {
            await signupUser(email, passwordHash, firstName, lastName);
        } catch (err) {
            console.error('Error creating user:', err);
            return fail(500, { error: 'Something went wrong creating your account.', email, firstName, lastName });
        }

        redirect(303, '/login');
    }
};
