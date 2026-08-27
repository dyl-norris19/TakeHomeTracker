/**
 * Reads a field from FormData, rejecting anything that isn't a plain string
 * (e.g. a File submitted for a field that should be text). Returns null
 * instead of silently stringifying non-string values.
 */
export function getFormString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	return typeof value === 'string' ? value : null;
}
