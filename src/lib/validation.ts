import { savingsCents } from './money';

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

export type MonthName = (typeof MONTHS)[number];

/**
 * Index (0-11) of a month name, or -1 if it isn't a known month. Cards store the
 * month as a plain string, so this is the widening lookup back into {@link MONTHS}.
 */
export function monthNameToIndex(name: string): number {
	return (MONTHS as readonly string[]).indexOf(name);
}

export type SavingsMethod = 'percent' | 'flat';

/** A bill as it's stored/computed: an integer-cents amount. */
export type CardBillInput = { name: string; amountCents: number };

/** A slice of a card's savings put toward one savings goal. */
export type GoalAllocationInput = { goalId: number; amountCents: number };

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
	goalAllocations: GoalAllocationInput[] | null;
	notes: string | null;
};

export type CardFormField =
	| 'month'
	| 'paycheckNumber'
	| 'payAmount'
	| 'savingsType'
	| 'savingsAmount'
	| 'reoccurBills'
	| 'otherBills'
	| 'goalAllocations';

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

	const allocationError = validateGoalAllocations(values);
	if (allocationError) {
		errors.goalAllocations = allocationError;
	}

	return errors;
}

/**
 * Validates how a card's savings is split across goals. The split can't add up
 * to more than the card's savings; whatever is left over is general savings.
 */
function validateGoalAllocations(values: CardFormValues): string | null {
	const allocations = values.goalAllocations;
	if (allocations === null) {
		return "Couldn't read your goal amounts — make sure every amount is a number.";
	}
	const seen = new Set<number>();
	let total = 0;
	for (const allocation of allocations) {
		if (!Number.isInteger(allocation.amountCents)) {
			return 'Every goal amount must be a number.';
		}
		if (allocation.amountCents < 0) {
			return "Goal amounts can't be negative.";
		}
		if (seen.has(allocation.goalId)) {
			return 'Each goal can only be listed once.';
		}
		seen.add(allocation.goalId);
		total += allocation.amountCents;
	}
	// Only compare against savings once the savings itself is valid; otherwise
	// the savings field already carries the error.
	if (
		values.savingsMethod &&
		Number.isInteger(values.savingsValue) &&
		Number.isInteger(values.payAmountCents)
	) {
		const available = savingsCents(
			values.payAmountCents,
			values.savingsMethod,
			values.savingsValue
		);
		if (total > available) {
			return "Goal amounts add up to more than this card's savings.";
		}
	}
	return null;
}

export type GoalFormValues = {
	name: string;
	targetCents: number;
	startingCents: number;
};

export type GoalFormErrors = Partial<Record<'name' | 'target' | 'starting', string>>;

/** Validates a new savings goal. An empty object means it's good to save. */
export function validateGoalForm(values: GoalFormValues): GoalFormErrors {
	const errors: GoalFormErrors = {};

	if (!values.name.trim()) {
		errors.name = 'Give the goal a name.';
	}

	if (!Number.isInteger(values.targetCents)) {
		errors.target = 'Enter a target amount.';
	} else if (values.targetCents <= 0) {
		errors.target = 'Target must be greater than 0.';
	}

	if (!Number.isInteger(values.startingCents)) {
		errors.starting = 'Starting amount must be a number.';
	} else if (values.startingCents < 0) {
		errors.starting = "Starting amount can't be negative.";
	}

	return errors;
}
