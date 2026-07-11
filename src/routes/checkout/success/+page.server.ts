import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { inArray } from 'drizzle-orm';
import { stripe } from '$lib/stripe.js';
import { db } from '$lib/index.js';
import { artwork } from '../../../db/schema.js';

export const load: PageServerLoad = async ({ url }) => {
	const sessionId = url.searchParams.get('session_id');

	if (!sessionId) {
		throw redirect(302, '/products');
	}

	let session;
	try {
		session = await stripe.checkout.sessions.retrieve(sessionId);
	} catch (err) {
		console.error('Error retrieving checkout session:', err);
		throw error(404, 'Order not found');
	}

	if (session.status !== 'complete') {
		// Buyer landed here without finishing payment — send them back
		throw redirect(302, '/checkout');
	}

	let artworkIds: string[] = [];
	try {
		const parsed = JSON.parse(session.metadata?.artworkIds ?? '[]');
		if (Array.isArray(parsed)) {
			artworkIds = parsed.filter((id): id is string => typeof id === 'string');
		}
	} catch (e) {
		console.error('Failed to parse artworkIds metadata:', e);
	}

	let titles: string[] = [];
	if (artworkIds.length > 0) {
		const pieces = await db
			.select({ id: artwork.id, title: artwork.title })
			.from(artwork)
			.where(inArray(artwork.id, artworkIds));
		titles = pieces.map((piece) => piece.title);
	}

	return {
		titles,
		customerEmail: session.customer_details?.email ?? null,
		totalCents: session.amount_total ?? 0,
		currency: session.currency ?? 'usd'
	};
};
