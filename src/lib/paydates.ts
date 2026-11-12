import { MONTHS } from './validation';

export const FREQUENCIES = ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const WEEKEND_RULES = ['before', 'after', 'none'] as const;
export type WeekendRule = (typeof WEEKEND_RULES)[number];

/**
 * When a user gets paid. Which fields matter depends on `frequency`:
 * weekly / biweekly step from `anchorDate`; monthly uses `payDay1`;
 * semimonthly uses `payDay1` and `payDay2`. `weekendRule` only applies to the
 * day-of-month schedules.
 */
export type PaydaySettings = {
	frequency: Frequency;
	anchorDate: string | null;
	payDay1: number | null;
	payDay2: number | null;
	weekendRule: WeekendRule;
};

/** `true` when the user is paid on a single fixed day each month. */
export function isMonthly(settings: PaydaySettings): boolean {
	return settings.frequency === 'monthly';
}

/** A local Date -> its `YYYY-MM-DD` calendar date. */
export function toIsoDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * A `YYYY-MM-DD` string -> local midnight on that calendar date, or null when
 * malformed or not a real date (e.g. `2026-02-30`). Parsed by hand because
 * `new Date('2026-05-01')` means UTC midnight, which is the day before in the US.
 */
export function parseIsoDate(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) {
		return null;
	}
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return null;
	}
	return date;
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
 * Moves a Saturday / Sunday payday to the Friday before or the Monday after.
 * Weekdays, and the `none` rule, come back unchanged.
 */
export function shiftForWeekend(date: Date, rule: WeekendRule): Date {
	const day = date.getDay();
	if (rule === 'none' || (day !== 0 && day !== 6)) {
		return date;
	}
	// Saturday -> Fri (-1) / Mon (+2); Sunday -> Fri (-2) / Mon (+1).
	const shift = rule === 'before' ? (day === 6 ? -1 : -2) : day === 6 ? 2 : 1;
	return addDays(date, shift);
}

/**
 * Every payday belonging to the given month, ascending.
 *
 * Monthly / semimonthly: each pay day clamped to the month's last day (so the
 * 31st still lands in February), then moved off a weekend per `weekendRule`.
 * That move can push a date into the neighbouring month (the 1st on a Saturday
 * paid Friday the 31st), but it still counts as this month's paycheck.
 * Weekly / biweekly: the anchor stepped by its interval in both directions,
 * keeping the dates whose calendar month matches.
 */
export function paydatesInMonth(
	settings: PaydaySettings,
	year: number,
	monthIndex: number
): Date[] {
	if (settings.frequency === 'monthly' || settings.frequency === 'semimonthly') {
		const days = (
			settings.frequency === 'monthly'
				? [settings.payDay1]
				: [settings.payDay1, settings.payDay2]
		).filter((day): day is number => day !== null);
		const last = lastDayOfMonth(year, monthIndex);
		return days
			.sort((a, b) => a - b)
			.map((day) =>
				shiftForWeekend(new Date(year, monthIndex, Math.min(day, last)), settings.weekendRule)
			);
	}

	const anchor = settings.anchorDate ? parseIsoDate(settings.anchorDate) : null;
	if (!anchor) {
		return [];
	}

	const intervalDays = settings.frequency === 'biweekly' ? 14 : 7;
	const monthStart = new Date(year, monthIndex, 1);
	const monthEnd = new Date(year, monthIndex + 1, 1); // exclusive

	// Step by whole days (not milliseconds) so a DST change can't nudge a
	// payday onto the wrong calendar date. Walk back to before the month starts
	// (works whether the anchor is before or after the target month), then step
	// forward to the first payday inside it.
	let cursor = anchor;
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

/** The next `count` paydays on or after `from` (by calendar day), ascending. */
export function upcomingPaydates(
	settings: PaydaySettings,
	from: Date = new Date(),
	count = 4
): Date[] {
	const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
	const dates: Date[] = [];
	// Start a month back to catch a payday shifted forward out of it; the most
	// sparse schedule (monthly) needs `count` months ahead.
	for (let offset = -1; offset <= count; offset++) {
		const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
		dates.push(...paydatesInMonth(settings, base.getFullYear(), base.getMonth()));
	}
	return dates
		.filter((date) => date >= today)
		.sort((a, b) => a.getTime() - b.getTime())
		.slice(0, count);
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
