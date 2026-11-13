import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { getUserByEmail } from '$lib/server/db/queries/users';
import { sendPasswordResetEmail } from '$lib/server/email';
import { getFormString } from '$lib/server/form-data';
import { RESET_TOKEN_MINUTES, createPasswordResetToken } from '$lib/server/password-reset';
import {
    RESET_EMAIL_POLICY,
    RESET_IP_POLICY,
    beginAttempt,
    clientIp,
    describeWait,
    type Throttle
} from '$lib/server/throttle';
import { isValidEmail } from '$lib/validation';

const MAX_EMAIL_LENGTH = 254;

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const email = getFormString(formData, 'email')?.trim().toLowerCase();

        if (!email) {
            return fail(400, { error: 'Enter your email address.', email });
        }
        if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
            return fail(400, { error: 'Please enter a valid email address.', email });
        }

        // Every request counts, whether or not the email has an account.
        const throttles: Throttle[] = [{ key: `reset:email:${email}`, policy: RESET_EMAIL_POLICY }];
        const ip = clientIp(event);
        if (ip) {
            throttles.unshift({ key: `reset:ip:${ip}`, policy: RESET_IP_POLICY });
        }
        const lockedUntil = beginAttempt(throttles);
        if (lockedUntil) {
            return fail(429, {
                error: `Too many reset requests. Try again in ${describeWait(lockedUntil)}.`,
                email
            });
        }

        const user = await getUserByEmail(email);
        if (user) {
            const token = createPasswordResetToken(user.id);
            // Built from the configured ORIGIN, never the request's Host header,
            // which a caller could forge to point the emailed link at their own site.
            const origin = env.ORIGIN || event.url.origin;
            const resetUrl = `${origin}/reset-password/${token}`;

            // Not awaited: waiting on SMTP would make requests for real accounts
            // measurably slower than requests for unknown emails.
            sendPasswordResetEmail(user.email, resetUrl, RESET_TOKEN_MINUTES).catch((err) => {
                console.error('[email] Failed to send password reset email:', err);
            });
        }

        // Same answer either way, so this form can't be used to find out who has an account.
        return { sent: true };
    }
};
