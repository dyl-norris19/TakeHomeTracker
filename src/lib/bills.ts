import { parseIsoDate, resolvePaydate, toIsoDate, upcomingPaydates } from './paydates';
import type { Frequency, PaydaySettings } from './paydates';

export const AMOUNT_TYPES = ['flat', 'percent'] as const;
export type AmountType = (typeof AMOUNT_TYPES)[number];

export const ALLOCATIONS = ['single', 'split'] as const;
export type Allocation = (typeof ALLOCATIONS)[number];

/**
 * A recurring bill as saved in settings. Which fields matter depends on the type:
 * - flat + single: `amountCents` lands on the paycheck covering `dueDay`.
 * - flat + split: `amountCents` is the monthly total; every paycheck gets an
 *   equal share of it (see {@link paychecksPerMonth}).
 * - percent: `basisPoints` of each card's pay amount, on every paycheck.
 */
export type RecurringBill = {
	name: string;
	amountType: AmountType;
	amountCents: number | null;
	basisPoints: number | null;
	allocation: Allocation;
	dueDay: number | null;
};

/**
 * How many paychecks a normal month has. A split bill is divided by this, and a
 * month with an extra paycheck just gets one more share.
 */
export function paychecksPerMonth(frequency: Frequency): number {
	switch (frequency) {
		case 'weekly':
			return 4;
		case 'biweekly':
		case 'semimonthly':
			return 2;
		case 'monthly':
			return 1;
	}
}

/**
 * A recurring bill as it lands on one paycheck. Flat bills already have their
 * cents; percent bills keep `basisPoints` because the card's pay amount isn't
 * known until it's typed in. `dueDate` (`YYYY-MM-DD`) is set for single bills.
 */
export type PaycheckBill = {
	name: string;
	amountCents: number | null;
	basisPoints: number | null;
	dueDate: string | null;
};

/** The first payday strictly after `payDate`. */
function nextPaydate(settings: PaydaySettings, payDate: Date): Date | null {
	const dayAfter = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate() + 1);
	return upcomingPaydates(settings, dayAfter, 1)[0] ?? null;
}

/**
 * The date a bill due on `dueDay` falls in [`start`, `end`), or null if none.
 * The window is one pay period, so it can cross into the next month (and, with
 * a weekend-shifted monthly payday, the one after).
 */
function dueDateInWindow(dueDay: number, start: Date, end: Date): Date | null {
	for (let offset = 0; offset <= 2; offset++) {
		const year = start.getFullYear();
		const monthIndex = start.getMonth() + offset;
		const last = new Date(year, monthIndex + 1, 0).getDate();
		const due = new Date(year, monthIndex, Math.min(dueDay, last));
		if (due >= start && due < end) {
			return due;
		}
	}
	return null;
}

/**
 * The recurring bills that belong on a given paycheck. A single bill goes on
 * the paycheck whose pay period (its payday up to the day before the next one)
 * holds its due date. Split and percent bills go on every paycheck.
 * Returns an empty list when that paycheck doesn't exist.
 */
export function billsForPaycheck(
	bills: readonly RecurringBill[],
	settings: PaydaySettings,
	year: number,
	monthIndex: number,
	paycheckNumber: number
): PaycheckBill[] {
	const payDate = resolvePaydate(settings, year, monthIndex, paycheckNumber);
	if (!payDate) {
		return [];
	}
	const next = nextPaydate(settings, payDate);

	return bills.flatMap((bill): PaycheckBill[] => {
		if (bill.amountType === 'percent') {
			return [{ name: bill.name, amountCents: null, basisPoints: bill.basisPoints, dueDate: null }];
		}
		const amountCents = bill.amountCents ?? 0;
		if (bill.allocation === 'split') {
			return [
				{
					name: bill.name,
					amountCents: Math.round(amountCents / paychecksPerMonth(settings.frequency)),
					basisPoints: null,
					dueDate: null
				}
			];
		}
		if (bill.dueDay === null || !next) {
			return [];
		}
		const due = dueDateInWindow(bill.dueDay, payDate, next);
		return due
			? [{ name: bill.name, amountCents, basisPoints: null, dueDate: toIsoDate(due) }]
			: [];
	});
}

const dueFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** `2026-03-14` -> `Mar 14`, or empty for a missing / malformed date. */
export function formatDueDate(dueDate: string | null | undefined): string {
	const date = dueDate ? parseIsoDate(dueDate) : null;
	return date ? dueFmt.format(date) : '';
}
