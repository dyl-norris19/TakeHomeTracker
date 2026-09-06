import { MONTHS } from './validation';

export type PaydaySettings = { paydate: Date; frequency: number };

/** `true` when the user is paid on a fixed day each month (frequency 1). */
export function isMonthly(settings: PaydaySettings): boolean {
	return settings.frequency === 1;
}

function lastDayOfMonth(year: number, monthIndex: number): number {
	// Day 0 of the next month is the last day of this one.
	return new Date(year, monthIndex + 1, 0).getDate();
}

/** A new Date `days` calendar days from `date`, keeping local wall-clock time. */
function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

/**
 * Every payday that falls within the given month, ascending.
 *
 * Monthly: the anchor's day-of-month, clamped to the month's last day (so an
 * anchor on the 31st still lands in February).
 * Weekly / biweekly: the anchor stepped by its interval in both directions,
 * keeping the dates whose calendar month matches.
 */
export function paydatesInMonth(
	settings: PaydaySettings,
	year: number,
	monthIndex: number
): Date[] {
	const { paydate, frequency } = settings;

	if (frequency === 1) {
		const day = Math.min(paydate.getDate(), lastDayOfMonth(year, monthIndex));
		return [new Date(year, monthIndex, day)];
	}

	const intervalDays = frequency === 2 ? 14 : 7;
	const monthStart = new Date(year, monthIndex, 1);
	const monthEnd = new Date(year, monthIndex + 1, 1); // exclusive

	// Step by whole days (not milliseconds) so a DST change can't nudge a
	// payday onto the wrong calendar date. Anchor at local midnight, walk back
	// to before the month starts (works whether the anchor is before or after
	// the target month), then step forward to the first payday inside it.
	let cursor = new Date(paydate.getFullYear(), paydate.getMonth(), paydate.getDate());
	while (cursor >= monthStart) {
		cursor = addDays(cursor, -intervalDays);
	}
	while (cursor < monthStart) {
		cursor = addDays(cursor, intervalDays);
	}

	const dates: Date[] = [];
	for (; cursor < monthEnd; cursor = addDays(cursor, intervalDays)) {
		dates.push(cursor);
	}
	return dates;
}

/** How many paychecks land in the given month for this schedule. */
export function paycheckCountInMonth(
	settings: PaydaySettings,
	year: number,
	monthIndex: number
): number {
	return paydatesInMonth(settings, year, monthIndex).length;
}

/**
 * The date of the Nth paycheck (1-based) in the given month, or null when that
 * month has fewer than N paychecks.
 */
export function resolvePaydate(
	settings: PaydaySettings,
	year: number,
	monthIndex: number,
	paycheckNumber: number
): Date | null {
	const dates = paydatesInMonth(settings, year, monthIndex);
	return dates[paycheckNumber - 1] ?? null;
}

export type MonthOption = {
	year: number;
	monthIndex: number;
	value: string;
	label: string;
};

/** The `YYYY-MM` <select> value for a month. */
export function toMonthValue(year: number, monthIndex: number): string {
	return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/**
 * Month choices for the New Card picker: three months back (for catching up)
 * through three months ahead. `value` is a `YYYY-MM` string for the <select>.
 */
export function monthOptions(from: Date = new Date()): MonthOption[] {
	const options: MonthOption[] = [];
	for (let offset = -3; offset <= 3; offset++) {
		const d = new Date(from.getFullYear(), from.getMonth() + offset, 1);
		const year = d.getFullYear();
		const monthIndex = d.getMonth();
		options.push({
			year,
			monthIndex,
			value: toMonthValue(year, monthIndex),
			label: `${MONTHS[monthIndex]} ${year}`
		});
	}
	return options;
}

export type NearestPaycheck = {
	year: number;
	monthIndex: number;
	paycheckNumber: number;
	value: string;
	date: Date;
};

/**
 * The paycheck whose payday sits closest to `ref` — past or future — for
 * pre-filling the New Card picker. So the day after payday still points at the
 * cheque that just landed, while mid-cycle points at the next one. An exact tie
 * favours the upcoming paycheck. Returns null without pay settings.
 */
export function nearestPaycheck(
	settings: PaydaySettings,
	ref: Date = new Date()
): NearestPaycheck | null {
	const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();

	let best: NearestPaycheck | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	// One month either side of `ref` is always enough to hold the closest payday.
	for (let offset = -1; offset <= 1; offset++) {
		const base = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
		const year = base.getFullYear();
		const monthIndex = base.getMonth();

		paydatesInMonth(settings, year, monthIndex).forEach((date, index) => {
			const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
			const distance = Math.abs(day - refDay);
			// `<=`, walking dates ascending, so a tie keeps the later (upcoming) one.
			if (distance <= bestDistance) {
				bestDistance = distance;
				best = {
					year,
					monthIndex,
					paycheckNumber: index + 1,
					value: toMonthValue(year, monthIndex),
					date
				};
			}
		});
	}

	return best;
}

/** Parses a `YYYY-MM` value from {@link monthOptions}. Returns null if malformed. */
export function parseMonthValue(value: string): { year: number; monthIndex: number } | null {
	const match = /^(\d{4})-(\d{2})$/.exec(value);
	if (!match) {
		return null;
	}
	const year = Number(match[1]);
	const monthIndex = Number(match[2]) - 1;
	if (monthIndex < 0 || monthIndex > 11) {
		return null;
	}
	return { year, monthIndex };
}
