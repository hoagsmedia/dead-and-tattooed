import { redirect } from '@sveltejs/kit';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/index.js';
import { artwork, order, orderItem } from '../../db/schema.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	// Orders are matched by email, so a VERIFIED email is the gate: without it,
	// anyone could sign up with a buyer's address and read their purchase
	// history + shipping details. Unverified users get a verify prompt instead.
	if (!locals.user.emailVerified) {
		return { verified: false as const, orders: [] };
	}

	const orders = await db
		.select({
			id: order.id,
			total: order.total,
			currency: order.currency,
			status: order.status,
			createdAt: order.createdAt
		})
		.from(order)
		.where(eq(order.customerEmail, locals.user.email))
		.orderBy(desc(order.createdAt));

	const orderIds = orders.map((o) => o.id);
	const items = orderIds.length
		? await db
				.select({
					orderId: orderItem.orderId,
					name: orderItem.name,
					price: orderItem.price,
					artworkId: orderItem.artworkId
				})
				.from(orderItem)
				.where(inArray(orderItem.orderId, orderIds))
		: [];

	// Cover images for the pieces bought (artwork rows survive sales).
	const artworkIds = [...new Set(items.map((i) => i.artworkId).filter((v): v is string => !!v))];
	const art = artworkIds.length
		? await db
				.select({ id: artwork.id, images: artwork.images })
				.from(artwork)
				.where(inArray(artwork.id, artworkIds))
		: [];
	const coverByArtwork = new Map(art.map((a) => [a.id, a.images[0] ?? null]));

	return {
		verified: true as const,
		orders: orders.map((o) => ({
			...o,
			items: items
				.filter((i) => i.orderId === o.id)
				.map((i) => ({
					name: i.name,
					price: i.price,
					image: i.artworkId ? (coverByArtwork.get(i.artworkId) ?? null) : null,
					artworkId: i.artworkId
				}))
		}))
	};
};
