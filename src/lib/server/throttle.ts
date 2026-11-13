import { and, eq, isNull, lt, or } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import { authThrottles } from './db/schema/auth-throttles';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// A key's strikes are forgotten once it has gone this long without being locked.
const STRIKE_DECAY_MS = 30 * DAY_MS;
const PRUNE_INTERVAL_MS = HOUR_MS;

export type ThrottlePolicy = {
    /** Failed attempts allowed per window before the key is locked. */
    maxFailures: number;
    windowMs: number;
    /** Lock length per strike; the last entry repeats for every strike after it. */
    lockDurationsMs: readonly number[];
};

export type Throttle = { key: string; policy: ThrottlePolicy };

/**
 * Per-account limit. Deliberately flat: an escalating lock would let anyone who
 * knows an email keep its owner out for days just by failing on purpose.
 */
export const LOGIN_EMAIL_POLICY: ThrottlePolicy = {
    maxFailures: 5,
    windowMs: 15 * MINUTE_MS,
    lockDurationsMs: [15 * MINUTE_MS]
};

/** Per-address limit. Each block is longer than the last, capped at a week. */
export const LOGIN_IP_POLICY: ThrottlePolicy = {
    maxFailures: 20,
    windowMs: 15 * MINUTE_MS,
    lockDurationsMs: [15 * MINUTE_MS, HOUR_MS, 4 * HOUR_MS, DAY_MS, 7 * DAY_MS]
};

type ThrottleState = typeof authThrottles.$inferSelect;

// Everything below is synchronous (better-sqlite3), so each read-then-write runs
// without another request interleaving. Keep it free of awaits.

/** Reads a key's state, with an expired lock or window already rolled over. */
function load(key: string, policy: ThrottlePolicy, now: Date): ThrottleState {
    const state: ThrottleState = db
        .select()
        .from(authThrottles)
        .where(eq(authThrottles.key, key))
        .get() ?? {
        key,
        failCount: 0,
        windowStartedAt: now,
        lockedUntil: null,
        strikes: 0,
        lastLockedAt: null
    };

    if (isLocked(state, now)) {
        return state;
    }

    const windowExpired = now.getTime() - state.windowStartedAt.getTime() >= policy.windowMs;
    if (state.lockedUntil !== null || windowExpired) {
        state.failCount = 0;
        state.windowStartedAt = now;
        state.lockedUntil = null;
    }
    return state;
}

function save(state: ThrottleState): void {
    db.insert(authThrottles)
        .values(state)
        .onConflictDoUpdate({
            target: authThrottles.key,
            set: {
                failCount: state.failCount,
                windowStartedAt: state.windowStartedAt,
                lockedUntil: state.lockedUntil,
                strikes: state.strikes,
                lastLockedAt: state.lastLockedAt
            }
        })
        .run();
}

function isLocked(state: ThrottleState, now: Date): state is ThrottleState & { lockedUntil: Date } {
    return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

function lock(state: ThrottleState, policy: ThrottlePolicy, now: Date): Date {
    const strikesDecayed =
        state.lastLockedAt !== null &&
        now.getTime() - state.lastLockedAt.getTime() >= STRIKE_DECAY_MS;
    const strikes = strikesDecayed ? 0 : state.strikes;
    const durations = policy.lockDurationsMs;
    const durationMs = durations[Math.min(strikes, durations.length - 1)];

    const lockedUntil = new Date(now.getTime() + durationMs);
    state.lockedUntil = lockedUntil;
    state.strikes = strikes + 1;
    state.lastLockedAt = now;
    save(state);
    reportLock(state.key, lockedUntil, state.strikes);

    return lockedUntil;
}

/** The one place every lock passes through, so alerting can hook in here later. */
function reportLock(key: string, lockedUntil: Date, strikes: number): void {
    console.warn(
        `[throttle] locked ${key} until ${lockedUntil.toISOString()} (strike ${strikes})`
    );
}

/**
 * Call before checking a credential. Counts the attempt against every throttle
 * and returns null, or returns when to retry if any of them is locked.
 *
 * Counting up front (rather than after a failure) is what stops a burst of
 * parallel requests from all slipping through before the first failure lands.
 * Follow it with {@link failAttempt}, or {@link refundAttempt} / {@link clearThrottle}.
 */
export function beginAttempt(throttles: Throttle[]): Date | null {
    const now = new Date();
    pruneIfDue(now);

    for (const { key, policy } of throttles) {
        const state = load(key, policy, now);
        if (isLocked(state, now)) {
            return state.lockedUntil;
        }
        if (state.failCount >= policy.maxFailures) {
            return lock(state, policy, now);
        }
        state.failCount += 1;
        save(state);
    }
    return null;
}

/**
 * Call when the attempt counted by {@link beginAttempt} failed. Locks any
 * throttle that has now used up its failures and returns the latest lock
 * expiry, or null if nothing is locked.
 */
export function failAttempt(throttles: Throttle[]): Date | null {
    const now = new Date();
    let latest: Date | null = null;

    for (const { key, policy } of throttles) {
        const state = load(key, policy, now);
        let lockedUntil: Date | null = null;
        if (isLocked(state, now)) {
            lockedUntil = state.lockedUntil;
        } else if (state.failCount >= policy.maxFailures) {
            lockedUntil = lock(state, policy, now);
        }
        if (lockedUntil && (!latest || lockedUntil.getTime() > latest.getTime())) {
            latest = lockedUntil;
        }
    }
    return latest;
}

/**
 * Un-counts one attempt that turned out to succeed. Use for throttles a success
 * shouldn't wipe clean: an attacker with their own account could otherwise
 * reset their address's count by logging into it between guesses.
 */
export function refundAttempt({ key, policy }: Throttle): void {
    const now = new Date();
    const state = load(key, policy, now);
    if (!isLocked(state, now) && state.failCount > 0) {
        state.failCount -= 1;
        save(state);
    }
}

/** Forgets a key entirely, lock included. */
export function clearThrottle(key: string): void {
    db.delete(authThrottles).where(eq(authThrottles.key, key)).run();
}

let lastPrunedAt = 0;

/** Drops rows that no longer hold a lock, a live window, or undecayed strikes. */
function pruneIfDue(now: Date): void {
    if (now.getTime() - lastPrunedAt < PRUNE_INTERVAL_MS) {
        return;
    }
    lastPrunedAt = now.getTime();

    db.delete(authThrottles)
        .where(
            and(
                or(isNull(authThrottles.lockedUntil), lt(authThrottles.lockedUntil, now)),
                lt(authThrottles.windowStartedAt, new Date(now.getTime() - DAY_MS)),
                or(
                    isNull(authThrottles.lastLockedAt),
                    lt(authThrottles.lastLockedAt, new Date(now.getTime() - STRIKE_DECAY_MS))
                )
            )
        )
        .run();
}

let warnedNoClientIp = false;

/**
 * The client's address, or null when it can't be determined. Behind a reverse
 * proxy this needs ADDRESS_HEADER set (see docker-compose.yml); adapter-node
 * throws if that header is missing, e.g. on a request that skipped the proxy.
 */
export function clientIp(event: RequestEvent): string | null {
    try {
        return event.getClientAddress();
    } catch {
        if (!warnedNoClientIp) {
            warnedNoClientIp = true;
            console.warn('[throttle] client address unavailable; per-address limits are skipped');
        }
        return null;
    }
}

/** "5 minutes", "1 hour", "7 days" — how long until `until`, rounded up. */
export function describeWait(until: Date): string {
    const ms = Math.max(until.getTime() - Date.now(), 0);
    const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`;

    const minutes = Math.max(Math.ceil(ms / MINUTE_MS), 1);
    if (minutes < 60) {
        return plural(minutes, 'minute');
    }
    const hours = Math.ceil(ms / HOUR_MS);
    if (hours < 24) {
        return plural(hours, 'hour');
    }
    return plural(Math.ceil(ms / DAY_MS), 'day');
}
