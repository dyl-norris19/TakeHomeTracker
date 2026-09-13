// Basic shape check: something, an @, dot-separated labels, at least one dot.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
	return EMAIL_PATTERN.test(value);
}

export const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
] as const;

export type SavingsMethod = 'percent' | 'flat';

/** A bill as it's stored/computed: an integer-cents amount. */
export type CardBillInput = { name: string; amountCents: number };

export type CardFormValues = {
	year: number;
	monthIndex: number;
	paycheckNumber: number;
	payAmountCents: number;
	savingsMethod: SavingsMethod | null;
	// Cents when the method is flat, basis points (hundredths of a percent) when
	// it's percent. Both are just a user number scaled by 100.
	savingsValue: number;
	reoccurBills: CardBillInput[] | null;
	otherBills: CardBillInput[] | null;
	notes: string | null;
};

export type CardFormField =
	| 'month'
	| 'paycheckNumber'
	| 'payAmount'
	| 'savingsType'
	| 'savingsAmount'
	| 'reoccurBills'
	| 'otherBills';

export type CardFormErrors = Partial<Record<CardFormField, string>>;

/**
 * Validates a list of bills (name + integer-cents amount). Returns the first
 * problem found, or null when every bill is fine.
 */
export function validateBills(bills: CardBillInput[] | null, label: string): string | null {
	if (bills === null) {
		return `Couldn't read your ${label} — make sure every amount is a number.`;
	}
	const singular = label.replace(/s$/, '');
	for (const bill of bills) {
		const name = bill.name.trim();
		if (!name) {
			return `Give every ${singular} a name.`;
		}
		if (!Number.isInteger(bill.amountCents)) {
			return `Enter an amount for "${name}".`;
		}
		if (bill.amountCents < 0) {
			return `"${name}" can't be a negative amount.`;
		}
	}
	return null;
}

/**
 * Validates a card submission. Returns a map of field -> message; an empty
 * object means the card is good to save.
 */
export function validateCardForm(values: CardFormValues): CardFormErrors {
	const errors: CardFormErrors = {};

	if (
		!Number.isInteger(values.year) ||
		!Number.isInteger(values.monthIndex) ||
		values.monthIndex < 0 ||
		values.monthIndex > 11
	) {
		errors.month = 'Pick a month.';
	}

	if (!Number.isInteger(values.paycheckNumber) || values.paycheckNumber < 1) {
		errors.paycheckNumber = 'Pick which paycheck this is.';
	}

	if (!Number.isInteger(values.payAmountCents)) {
		errors.payAmount = 'Enter your pay amount.';
	} else if (values.payAmountCents <= 0) {
		errors.payAmount = 'Pay amount must be greater than 0.';
	}

	if (!values.savingsMethod) {
		errors.savingsType = 'Choose how you save.';
	}

	if (!Number.isInteger(values.savingsValue)) {
		errors.savingsAmount = 'Enter a savings amount.';
	} else if (values.savingsValue < 0) {
		errors.savingsAmount = "Savings amount can't be negative.";
	} else if (values.savingsMethod === 'percent' && values.savingsValue > 10000) {
		errors.savingsAmount = "A savings percentage can't be over 100.";
	}

	const reoccurError = validateBills(values.reoccurBills, 'reoccuring bills');
	if (reoccurError) {
		errors.reoccurBills = reoccurError;
	}

	const otherError = validateBills(values.otherBills, 'other bills');
	if (otherError) {
		errors.otherBills = otherError;
	}

	return errors;
}
