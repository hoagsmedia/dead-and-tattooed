import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/index.js';
import { artwork } from '../../../db/schema.js';
import { dollarsToCents, releaseExpiredReservations } from '$lib/inventory.js';

export const load: PageServerLoad = async ({ params }) => {
	// Lazily free up pieces whose checkout reservation expired
	await releaseExpiredReservations(db);

	const [piece] = await db
		.select()
		.from(artwork)
		.where(and(eq(artwork.id, params.id), eq(artwork.published, true)))
		.limit(1);

	if (!piece) {
		throw error(404, 'Piece not found');
	}

	return {
		artwork: {
			id: piece.id,
			title: piece.title,
			description: piece.description,
			images: piece.images,
			priceCents: dollarsToCents(piece.price),
			status: piece.status
		}
	};
};
