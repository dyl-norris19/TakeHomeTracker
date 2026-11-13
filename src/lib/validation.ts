import { budgetBreakdown, type BudgetMethod, type BudgetMode, type CardBudget } from './money';
// Type-only: paydates.ts imports MONTHS from here, so a value import would be circular.
import type { Frequency, WeekendRule } from './paydates';
import type { RecurringBill } from './bills';

// Basic shape check: something, an @, dot-separated labels, at least one dot.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function isValidEmail(value: string): boolean {
	return EMAIL_PATTERN.test(value);
}

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt only reads the first 72 bytes, so anything past that would be ignored.
const MAX_PASSWORD_BYTES = 72;

/** Checks a new password against the password rules; null means it's fine. */
export function passwordError(password: string): string | null {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
	}
	if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
		return `Password must be ${MAX_PASSWORD_BYTES} characters or fewer.`;
	}
	return null;
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

/**
 * A bill as it's stored/computed: an integer-cents amount. Recurring bills on
 * a card also carry the `YYYY-MM-DD` date they're due, when they have one.
 */
export type CardBillInput = { name: string; amountCents: number; dueDate?: string | null };

/** A slice of a card's savings put toward one savings goal. */
export type GoalAllocationInput = { goalId: number; amountCents: number };

export type CardFormValues = {
	year: number;
	monthIndex: number;
	paycheckNumber: number;
	payAmountCents: number;
	budgetMode: BudgetMode | null;
	budgetMethod: BudgetMethod | null;
	// Cents when the method is flat, basis points (hundredths of a percent) when
	// it's percent. Both are just a user number scaled by 100.
	budgetValue: number;
	reoccurBills: CardBillInput[] | null;
	otherBills: CardBillInput[] | null;
	goalAllocations: GoalAllocationInput[] | null;
	notes: string | null;
};

export type CardFormField =
	| 'month'
	| 'paycheckNumber'
	| 'payAmount'
	| 'budgetType'
	| 'budgetAmount'
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

export function cardBudget(values: CardFormValues): CardBudget | null {
	if (!values.budgetMode || !values.budgetMethod || !Number.isInteger(values.budgetValue)) {
		return null;
	}
	return values.budgetMethod === 'percent'
		? { mode: values.budgetMode, method: 'percent', basisPoints: values.budgetValue }
		: { mode: values.budgetMode, method: 'flat', flatCents: values.budgetValue };
}

export function cardBreakdown(
	values: CardFormValues
): { savingsCents: number; takeHomeCents: number } | null {
	const budget = cardBudget(values);
	if (
		!budget ||
		!Number.isInteger(values.payAmountCents) ||
		values.reoccurBills === null ||
		values.otherBills === null ||
		values.reoccurBills.some((bill) => !Number.isInteger(bill.amountCents)) ||
		values.otherBills.some((bill) => !Number.isInteger(bill.amountCents))
	) {
		return null;
	}
	return budgetBreakdown({
		payAmountCents: values.payAmountCents,
		budget,
		reoccurBills: values.reoccurBills,
		otherBills: values.otherBills
	});
}

const BUDGET_MESSAGES = {
	splurge: {
		method: 'Choose how you save.',
		missing: 'Enter a savings amount.',
		negative: "Savings amount can't be negative.",
		overPercent: "A savings percentage can't be over 100."
	},
	save: {
		method: 'Choose how your allowance is set.',
		missing: 'Enter an allowance amount.',
		negative: "Allowance can't be negative.",
		overPercent: "An allowance percentage can't be over 100."
	}
} as const;

function overspentAllowance(values: CardFormValues): boolean {
	const breakdown = cardBreakdown(values);
	return breakdown !== null && breakdown.savingsCents < 0;
}

type BudgetErrors = Pick<CardFormErrors, 'budgetType' | 'budgetAmount'>;

function validateBudget(values: CardFormValues): BudgetErrors {
	if (!values.budgetMode) {
		return { budgetType: 'Choose save or splurge.' };
	}

	const messages = BUDGET_MESSAGES[values.budgetMode];
	const errors: BudgetErrors = {};

	if (!values.budgetMethod) {
		errors.budgetType = messages.method;
	}

	if (!Number.isInteger(values.budgetValue)) {
		errors.budgetAmount = messages.missing;
	} else if (values.budgetValue < 0) {
		errors.budgetAmount = messages.negative;
	} else if (values.budgetMethod === 'percent' && values.budgetValue > 10000) {
		errors.budgetAmount = messages.overPercent;
	} else if (values.budgetMode === 'save' && overspentAllowance(values)) {
		errors.budgetAmount = 'Your allowance is more than this paycheck has left after bills.';
	}

	return errors;
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

	Object.assign(errors, validateBudget(values));

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
	const breakdown = cardBreakdown(values);
	if (breakdown && total > breakdown.savingsCents) {
		return "Goal amounts add up to more than this card's savings.";
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

export type AdjustmentFormValues = {
	// Always positive here; the +/− direction applies the sign on the server.
	amountCents: number;
	note: string;
};

export type AdjustmentFormErrors = Partial<Record<'amount' | 'note', string>>;

/** Validates one goal adjustment. An empty object means it's good to save. */
export function validateAdjustmentForm(values: AdjustmentFormValues): AdjustmentFormErrors {
	const errors: AdjustmentFormErrors = {};

	if (!Number.isInteger(values.amountCents)) {
		errors.amount = 'Enter an amount.';
	} else if (values.amountCents <= 0) {
		errors.amount = 'Amount must be greater than 0.';
	}

	if (values.note.length > 200) {
		errors.note = 'Keep the note under 200 characters.';
	}

	return errors;
}

export type PayScheduleValues = {
	// Null when the submitted value isn't one of the known options.
	frequency: Frequency | null;
	anchorDate: string | null;
	payDay1: number | null;
	payDay2: number | null;
	weekendRule: WeekendRule | null;
	// Null when left blank (it's optional); NaN when it isn't a number.
	takeHomeCents: number | null;
};

function isDayOfMonth(day: number | null): boolean {
	return day !== null && Number.isInteger(day) && day >= 1 && day <= 31;
}

/**
 * Validates a pay schedule. Returns the first problem found, or null when it's
 * good to save. Only the fields the chosen frequency uses are checked.
 */
export function validatePaySchedule(values: PayScheduleValues): string | null {
	return scheduleError(values) ?? takeHomeError(values.takeHomeCents);
}

/** Checks the frequency and the date fields it uses. */
function scheduleError(values: PayScheduleValues): string | null {
	const { frequency } = values;
	if (frequency === null) {
		return 'Choose how often you get paid.';
	}
	if (frequency === 'weekly' || frequency === 'biweekly') {
		const valid = !!values.anchorDate && /^\d{4}-\d{2}-\d{2}$/.test(values.anchorDate);
		return valid ? null : 'Pick a recent payday.';
	}
	const payDays = payDaysError(values);
	if (payDays) {
		return payDays;
	}
	return values.weekendRule === null ? 'Choose what happens when payday lands on a weekend.' : null;
}

/** Checks the pay day(s) of a monthly / semimonthly schedule. */
function payDaysError(values: PayScheduleValues): string | null {
	if (values.frequency === 'monthly') {
		return isDayOfMonth(values.payDay1) ? null : 'Pick the day you get paid.';
	}
	if (!isDayOfMonth(values.payDay1) || !isDayOfMonth(values.payDay2)) {
		return 'Pick both days you get paid.';
	}
	return values.payDay1 === values.payDay2 ? 'Pick two different days.' : null;
}

/** Checks the optional salary. */
function takeHomeError(takeHomeCents: number | null): string | null {
	if (takeHomeCents === null) {
		return null;
	}
	if (!Number.isInteger(takeHomeCents)) {
		return 'Salary must be a number.';
	}
	return takeHomeCents <= 0 ? 'Salary must be greater than 0.' : null;
}

/**
 * Validates the recurring bills list from settings. Returns the first problem
 * found, or null when every bill is good to save. Only the fields a bill's
 * type uses are checked.
 */
export function validateRecurringBills(bills: RecurringBill[] | null): string | null {
	if (bills === null) {
		return "Couldn't read your bills — reload and try again.";
	}
	for (const bill of bills) {
		const error = recurringBillError(bill);
		if (error) {
			return error;
		}
	}
	return null;
}

/** Checks one recurring bill, looking only at the fields its type uses. */
function recurringBillError(bill: RecurringBill): string | null {
	const name = bill.name.trim();
	if (!name) {
		return 'Every bill needs a name.';
	}
	if (bill.amountType === 'percent') {
		return percentBillError(name, bill.basisPoints);
	}
	if (bill.amountCents === null || !Number.isInteger(bill.amountCents)) {
		return `Enter an amount for "${name}".`;
	}
	if (bill.amountCents < 0) {
		return `"${name}" can't be a negative amount.`;
	}
	if (bill.allocation === 'single' && !isDayOfMonth(bill.dueDay)) {
		return `Pick a due day for "${name}".`;
	}
	return null;
}

function percentBillError(name: string, basisPoints: number | null): string | null {
	if (basisPoints === null || !Number.isInteger(basisPoints)) {
		return `Enter a percentage for "${name}".`;
	}
	if (basisPoints <= 0 || basisPoints > 10000) {
		return `"${name}" must be between 0 and 100%.`;
	}
	return null;
}
