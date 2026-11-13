import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { getUserByEmail } from '$lib/server/db/queries/users';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { getFormString } from '$lib/server/form-data';
import { isValidEmail } from '$lib/validation';
import {
    LOGIN_EMAIL_POLICY,
    LOGIN_IP_POLICY,
    beginAttempt,
    clearThrottle,
    clientIp,
    describeWait,
    failAttempt,
    loginEmailKey,
    refundAttempt,
    type Throttle
} from '$lib/server/throttle';

// Longest address the email RFCs allow; also bounds the throttle key.
const MAX_EMAIL_LENGTH = 254;

// Compared against when the email has no account, so that case costs the same
// bcrypt work as a wrong password and can't be told apart by response time.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomUUID(), 10);

function tooManyAttempts(lockedUntil: Date, email: string) {
    return fail(429, {
        error: `Too many login attempts. Try again in ${describeWait(lockedUntil)}.`,
        email
    });
}

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

        if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
            return fail(400, { error: 'Please enter a valid email address.', email });
        }

        const emailThrottle: Throttle = { key: loginEmailKey(email), policy: LOGIN_EMAIL_POLICY };
        const ip = clientIp(event);
        const ipThrottle: Throttle | null = ip
            ? { key: `login:ip:${ip}`, policy: LOGIN_IP_POLICY }
            : null;
        const throttles = ipThrottle ? [ipThrottle, emailThrottle] : [emailThrottle];

        // While locked out the password isn't checked at all, so a lock gives
        // nothing away about whether the guess (or the account) was right.
        const lockedUntil = beginAttempt(throttles);
        if (lockedUntil) {
            return tooManyAttempts(lockedUntil, email);
        }

        const user = await getUserByEmail(email);
        const passwordMatches = await bcrypt.compare(
            password,
            user?.passwordHash ?? DUMMY_PASSWORD_HASH
        );
        if (!user || !passwordMatches) {
            const nowLockedUntil = failAttempt(throttles);
            if (nowLockedUntil) {
                return tooManyAttempts(nowLockedUntil, email);
            }
            return fail(401, { error: 'Invalid email or password.', email });
        }

        clearThrottle(emailThrottle.key);
        if (ipThrottle) {
            refundAttempt(ipThrottle);
        }

        const token = generateSessionToken();
        const session = await createSession(token, user.id);
        setSessionTokenCookie(event, token, session.expiresAt);

        redirect(303, '/tracker');
    }
};
