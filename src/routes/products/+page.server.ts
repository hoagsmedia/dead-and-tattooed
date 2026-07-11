import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/index.js';
import { artwork } from '../../db/schema.js';
import { dollarsToCents, releaseExpiredReservations } from '$lib/inventory.js';

export const load: PageServerLoad = async () => {
	try {
		// Lazily free up pieces whose checkout reservation expired
		await releaseExpiredReservations(db);

		const artworks = await db
			.select()
			.from(artwork)
			.where(eq(artwork.published, true))
			.orderBy(asc(artwork.sortOrder), desc(artwork.createdAt));

		return {
			artworks: artworks.map((piece) => ({
				id: piece.id,
				title: piece.title,
				description: piece.description,
				image: piece.images[0] ?? null,
				priceCents: dollarsToCents(piece.price),
				status: piece.status
			}))
		};
	} catch (err) {
		console.error('Error loading artwork:', err);
		throw error(500, 'Failed to load the gallery');
	}
};
