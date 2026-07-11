import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import { artwork } from '../db/schema.js';

/**
 * One-of-a-kind inventory helpers.
 *
 * The local `artwork` table is the single source of truth:
 * - `status` is one of 'available' | 'reserved' | 'sold'
 * - a piece is reserved for RESERVATION_MINUTES while a checkout session is open
 * - expired reservations are released lazily (storefront loads) and on
 *   `checkout.session.expired` webhooks
 *
 * All helpers take the db client as an argument so they can be exercised
 * against a test database.
 */

export type InventoryDb = NodePgDatabase<typeof schema>;

export const RESERVATION_MINUTES = 30;

export class ArtworkUnavailableError extends Error {
	unavailable: Array<{ id: string; title: string; status: string }>;

	constructor(unavailable: Array<{ id: string; title: string; status: string }>) {
		const titles = unavailable.map((a) => `"${a.title}"`).join(', ');
		const sold = unavailable.some((a) => a.status === 'sold');
		super(
			sold
				? `Sorry — ${titles} ${unavailable.length === 1 ? 'has' : 'have'} just been sold. Each piece is one of a kind.`
				: `Sorry — ${titles} ${unavailable.length === 1 ? 'is' : 'are'} reserved by another collector right now. Check back soon.`
		);
		this.name = 'ArtworkUnavailableError';
		this.unavailable = unavailable;
	}
}

/**
 * Lazily release reservations whose hold window has passed.
 * Called on storefront loads so abandoned checkouts free up pieces.
 */
export async function releaseExpiredReservations(db: InventoryDb): Promise<void> {
	await db
		.update(artwork)
		.set({ status: 'available', reservedUntil: null })
		.where(and(eq(artwork.status, 'reserved'), lt(artwork.reservedUntil, new Date())));
}

/**
 * Atomically reserve a set of one-of-a-kind pieces for checkout.
 *
 * Inside a single transaction:
 * 1. expired reservations on the requested pieces are released
 * 2. one UPDATE reserves every requested piece that is published and available,
 *    returning the ids it managed to reserve
 * 3. if any piece could not be reserved, the transaction is rolled back
 *    (releasing anything reserved in step 2) and ArtworkUnavailableError is
 *    thrown describing which pieces were just sold or reserved
 */
export async function reserveArtworks(db: InventoryDb, artworkIds: string[]): Promise<string[]> {
	const ids = [...new Set(artworkIds.filter(Boolean))];
	if (ids.length === 0) return [];

	return await db.transaction(async (tx) => {
		// Lazy release: an expired hold on a requested piece should not block it
		await tx
			.update(artwork)
			.set({ status: 'available', reservedUntil: null })
			.where(
				and(
					inArray(artwork.id, ids),
					eq(artwork.status, 'reserved'),
					lt(artwork.reservedUntil, new Date())
				)
			);

		const reserved = await tx
			.update(artwork)
			.set({
				status: 'reserved',
				reservedUntil: sql`now() + (${RESERVATION_MINUTES} * interval '1 minute')`
			})
			.where(
				and(inArray(artwork.id, ids), eq(artwork.status, 'available'), eq(artwork.published, true))
			)
			.returning({ id: artwork.id });

		if (reserved.length !== ids.length) {
			const reservedIds = new Set(reserved.map((r) => r.id));
			const missingIds = ids.filter((id) => !reservedIds.has(id));
			const missing = await tx
				.select({ id: artwork.id, title: artwork.title, status: artwork.status })
				.from(artwork)
				.where(inArray(artwork.id, missingIds));
			// Cover ids that don't exist at all / are unpublished
			const found = new Set(missing.map((m) => m.id));
			for (const id of missingIds) {
				if (!found.has(id)) missing.push({ id, title: 'One of the pieces', status: 'unavailable' });
			}
			// Throwing rolls back the transaction, releasing anything reserved above
			throw new ArtworkUnavailableError(missing);
		}

		return reserved.map((r) => r.id);
	});
}

/**
 * Release reservations that we hold (e.g. `checkout.session.expired` webhook).
 * Only touches pieces still marked 'reserved' — sold pieces stay sold.
 */
export async function releaseReservations(db: InventoryDb, artworkIds: string[]): Promise<void> {
	const ids = [...new Set(artworkIds.filter(Boolean))];
	if (ids.length === 0) return;

	await db
		.update(artwork)
		.set({ status: 'available', reservedUntil: null })
		.where(and(inArray(artwork.id, ids), eq(artwork.status, 'reserved')));
}

/**
 * Mark pieces sold after a completed checkout. Pieces stay published so they
 * remain visible in the gallery with a SOLD badge.
 */
export async function markArtworksSold(db: InventoryDb, artworkIds: string[]): Promise<void> {
	const ids = [...new Set(artworkIds.filter(Boolean))];
	if (ids.length === 0) return;

	await db
		.update(artwork)
		.set({ status: 'sold', reservedUntil: null })
		.where(inArray(artwork.id, ids));
}

/** Convert a numeric(10,2) dollars string from the db to integer cents. */
export function dollarsToCents(price: string | null): number | null {
	if (price === null || price === undefined || price === '') return null;
	const parsed = Number.parseFloat(price);
	if (Number.isNaN(parsed)) return null;
	return Math.round(parsed * 100);
}
