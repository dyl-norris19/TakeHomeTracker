/**
 * Money is stored and computed as integer cents. Floating-point numbers only
 * ever appear at the very edges
 *
 * Percentages are stored as integer basis points, i.e. hundredths of a percent. 
 * 15% -> 1500
 */

/**
 * Parse a user-entered dollar string to integer cents. Accepts `$`, thousands
 * separators and surrounding whitespace. A third or later decimal digit rounds
 * to the nearest cent (half up). Returns NaN when the input isn't a number —
 * blank included, so it reads as "missing" rather than silently 0.
 */
export function parseToCents(raw: unknown): number {
	if (typeof raw === 'number') {
		return Number.isFinite(raw) ? Math.round(raw * 100) : Number.NaN;
	}
	if (typeof raw !== 'string') {
		return Number.NaN;
	}
	const cleaned = raw.replace(/[$,\s]/g, '');
	const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(cleaned);
	if (!match || (match[2] === '' && (match[3] ?? '') === '')) {
		return Number.NaN;
	}
	const sign = match[1] === '-' ? -1 : 1;
	const whole = Number(match[2] || '0');
	const frac = match[3] ?? '';
	// "5" -> 500 -> 50 cents; "999" -> 999 -> 100 cents (rounds the whole up).
	const cents = whole * 100 + Math.round(Number((frac + '000').slice(0, 3)) / 10);
	return sign * cents;
}

/**
 * Parse a user-entered percentage ("15", "12.5") to integer basis points.
 * Same shape as {@link parseToCents} — a percent is just a number scaled by 100.
 */
export function parsePercentToBasisPoints(raw: unknown): number {
	return parseToCents(raw);
}

/** `basisPoints` percent of `cents`, rounded half up to whole cents. */
export function percentOfCents(cents: number, basisPoints: number): number {
	return Math.round((cents * basisPoints) / 10000);
}

/**
 * A card's savings in cents. `value` is cents for a flat method and basis
 * points for a percent method (see CardFormValues.savingsValue).
 */
export function savingsCents(
	payAmountCents: number,
	method: 'percent' | 'flat',
	value: number
): number {
	return method === 'percent' ? percentOfCents(payAmountCents, value) : value;
}

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Integer cents -> a display string like `$1,234.50`. */
export function formatCents(cents: number): string {
	return USD.format(cents / 100);
}

/** Integer cents -> a plain `1234.50` string for pre-filling an `<input>`. */
export function centsToInput(cents: number): string {
	return (cents / 100).toFixed(2);
}

/** Integer basis points -> a plain `12.5` string for pre-filling an `<input>`. */
export function basisPointsToInput(basisPoints: number): string {
	return String(basisPoints / 100);
}
