// Basic shape check: something, an @, something, a dot, something.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
	return EMAIL_PATTERN.test(value);
}
