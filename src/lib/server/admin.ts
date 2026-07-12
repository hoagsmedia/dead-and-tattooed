import { env } from '$env/dynamic/private';

/**
 * Seller allowlist. The store has ONE artist (plus Josh); signup is public
 * (buyers may get accounts someday) but only allowlisted emails may use the
 * dashboard, upload images, or publish artwork. Comma-separated, case-
 * insensitive: ADMIN_EMAILS="artist@example.com,josh@hoagsmedia.com".
 * Unset = deny everyone (fail closed) so a missing env var can't reopen the
 * store to strangers.
 */
export function isAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	return adminEmails().includes(email.toLowerCase());
}

/** The parsed ADMIN_EMAILS allowlist (trimmed, lowercased, empties dropped). */
export function adminEmails(): string[] {
	return (env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
}
