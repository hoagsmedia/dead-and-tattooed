import type { PageServerLoad, Actions } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import { stripe } from '$lib/stripe.js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { db } from '$lib/index.js';
import { artwork } from '../../db/schema.js';
import {
	ArtworkUnavailableError,
	dollarsToCents,
	releaseReservations,
	reserveArtworks
} from '$lib/inventory.js';

/** Countries we ship to. Extend as needed. */
const ALLOWED_COUNTRIES: Array<'US'> = ['US'];

const sessionRequestSchema = z.object({
	artworkIds: z.array(z.string().min(1)).min(1).max(50),
	existingSessionId: z.string().startsWith('cs_').optional()
});

export const load: PageServerLoad = async () => {
	const publishableKey = publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY;

	if (!publishableKey) {
		throw error(500, 'Stripe publishable key is not configured');
	}

	return { publishableKey };
};

export const actions: Actions = {
	/**
	 * Create an embedded Checkout Session for the cart's artwork.
	 *
	 * Prices, titles and images come from the local `artwork` table — Stripe is
	 * purely the payment rail (inline `price_data`, no catalog products/prices).
	 * Pieces are atomically reserved before the session is created so a
	 * one-of-a-kind piece can never be oversold.
	 */
	session: async ({ request, url }) => {
		const formData = await request.formData();

		let rawIds: unknown;
		try {
			rawIds = JSON.parse(formData.get('artworkIds')?.toString() ?? '[]');
		} catch {
			return fail(400, { message: 'Invalid cart data. Please refresh and try again.' });
		}

		const parsed = sessionRequestSchema.safeParse({
			artworkIds: rawIds,
			existingSessionId: formData.get('existingSessionId')?.toString() || undefined
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid cart data. Please refresh and try again.' });
		}

		const artworkIds = [...new Set(parsed.data.artworkIds)].sort();

		// Reuse an open session for the same pieces (e.g. page refresh) instead of
		// re-reserving — the buyer already holds the reservation.
		if (parsed.data.existingSessionId) {
			try {
				const existing = await stripe.checkout.sessions.retrieve(parsed.data.existingSessionId);
				const existingIds = JSON.parse(existing.metadata?.artworkIds ?? '[]') as string[];
				if (
					existing.status === 'open' &&
					existing.client_secret &&
					JSON.stringify([...existingIds].sort()) === JSON.stringify(artworkIds)
				) {
					return { clientSecret: existing.client_secret, sessionId: existing.id };
				}
			} catch {
				// Stale or foreign session id — fall through and create a new one
			}
		}

		// Load the pieces from the local db (single source of truth)
		const pieces = await db.select().from(artwork).where(inArray(artwork.id, artworkIds));

		const piecesById = new Map(pieces.map((piece) => [piece.id, piece]));
		for (const id of artworkIds) {
			const piece = piecesById.get(id);
			if (!piece || !piece.published) {
				return fail(409, {
					message: 'One of the pieces in your cart is no longer available.',
					unavailableIds: [id]
				});
			}
			if (dollarsToCents(piece.price) === null) {
				return fail(400, {
					message: `"${piece.title}" cannot be purchased right now. Please remove it from your cart.`,
					unavailableIds: [id]
				});
			}
		}

		// Oversell guard: atomically reserve every piece or none
		try {
			await reserveArtworks(db, artworkIds);
		} catch (err) {
			if (err instanceof ArtworkUnavailableError) {
				return fail(409, {
					message: err.message,
					unavailableIds: err.unavailable.map((piece) => piece.id)
				});
			}
			console.error('Error reserving artwork for checkout:', err);
			return fail(500, { message: 'Failed to start checkout. Please try again.' });
		}

		try {
			const session = await stripe.checkout.sessions.create({
				ui_mode: 'embedded',
				mode: 'payment',
				line_items: artworkIds.map((id) => {
					const piece = piecesById.get(id)!;
					const firstImage = piece.images[0];
					return {
						quantity: 1,
						price_data: {
							currency: 'usd',
							unit_amount: dollarsToCents(piece.price)!,
							product_data: {
								name: piece.title,
								...(firstImage ? { images: [firstImage] } : {}),
								...(piece.description ? { description: piece.description } : {})
							}
						}
					};
				}),
				shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },
				...(env.STRIPE_AUTOMATIC_TAX === '1' ? { automatic_tax: { enabled: true } } : {}),
				customer_creation: 'if_required',
				return_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
				// Keep the session lifetime aligned with the 30 minute reservation
				// (Stripe requires expires_at to be at least 30 minutes out)
				expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
				metadata: {
					artworkIds: JSON.stringify(artworkIds)
				}
			});

			if (!session.client_secret) {
				throw new Error('Checkout session has no client secret');
			}

			return { clientSecret: session.client_secret, sessionId: session.id };
		} catch (err) {
			console.error('Error creating checkout session:', err);
			// Give the pieces back — the buyer never saw a payment form
			await releaseReservations(db, artworkIds);
			return fail(500, { message: 'Failed to start checkout. Please try again.' });
		}
	}
};
