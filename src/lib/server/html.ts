/**
 * Escape a string for interpolation into HTML (email bodies, etc.).
 * Single shared implementation — every email builder must run user-controlled
 * fields (names, titles, addresses, tracking numbers, emails) through this.
 */
export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
