import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { z } from 'zod';
import { db } from '$lib/index.js';
import { subscribe } from '$lib/server/announce.js';

const emailSchema = z.email().max(254);

/**
 * Public "notify me" signup. Anti-abuse posture:
 * - `website` is a honeypot: humans never see it, bots fill it → pretend
 *   success and store nothing.
 * - The success response is identical whether the email was new or already
 *   on the list (no enumeration).
 */
const GENERIC_OK = {
	ok: true,
	message: "You're on the list — occasional drop emails only. Unsubscribe anytime."
};

export const POST: RequestHandler = async ({ request }) => {
	let email: string | undefined;
	let honeypot: string | undefined;

	try {
		const contentType = request.headers.get('content-type') ?? '';
		if (contentType.includes('application/json')) {
			const body = await request.json();
			email = typeof body?.email === 'string' ? body.email : undefined;
			honeypot = typeof body?.website === 'string' ? body.website : undefined;
		} else {
			const formData = await request.formData();
			email = formData.get('email')?.toString();
			honeypot = formData.get('website')?.toString();
		}
	} catch {
		// Unparseable body → fall through to validation failure below
	}

	// Honeypot filled: silently drop, indistinguishable from success
	if (honeypot) {
		return json(GENERIC_OK);
	}

	const parsed = emailSchema.safeParse(email?.trim());
	if (!parsed.success) {
		return json({ ok: false, message: 'Enter a valid email address.' }, { status: 400 });
	}

	try {
		await subscribe(db, parsed.data);
	} catch (err) {
		console.error('[subscribe] failed:', err);
		return json({ ok: false, message: 'Something went wrong — try again.' }, { status: 500 });
	}

	return json(GENERIC_OK);
};
