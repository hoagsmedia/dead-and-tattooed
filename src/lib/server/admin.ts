import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

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

/**
 * Gate for every admin surface (dashboard loads AND actions — actions don't
 * run layout loads, so each one must call this itself). Throws:
 * - redirect to /auth when signed out
 * - 403 when signed in but not on the allowlist, or when the allowlisted
 *   email is unverified (an unverified claim on an admin address must never
 *   grant the dashboard)
 */
export function requireAdmin(locals: App.Locals): NonNullable<App.Locals['user']> {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	if (!isAdmin(locals.user.email) || !locals.user.emailVerified) {
		throw error(
			403,
			'The dashboard is for the artist. Contact the shop if you should have access.'
		);
	}
	return locals.user;
}

/** The parsed ADMIN_EMAILS allowlist (trimmed, lowercased, empties dropped). */
export function adminEmails(): string[] {
	return (env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
}
