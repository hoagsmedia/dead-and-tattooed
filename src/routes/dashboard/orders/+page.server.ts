import { fail, redirect } from '@sveltejs/kit';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/index.js';
import { artwork, order, orderItem } from '../../../db/schema.js';
import { isAdmin } from '$lib/server/admin';
import { sendEmail } from '$lib/server/email';
import { buildShippedEmail, shippingAddressLines, trackingUrl } from '$lib/server/order-emails';
import type { PageServerLoad, Actions } from './$types';

// The dashboard layout already gates on ADMIN_EMAILS, but layout loads don't
// run for form actions (and page loads can run in parallel with them), so
// both load and action re-check on their own.
function assertAdmin(locals: App.Locals): void {
	if (!locals.user || !isAdmin(locals.user.email)) {
		throw redirect(302, '/auth');
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	assertAdmin(locals);

	const orders = await db.select().from(order).orderBy(desc(order.createdAt));

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

	// Cover thumbnails for pieces still linked to an artwork row.
	const artworkIds = [...new Set(items.map((i) => i.artworkId).filter((v): v is string => !!v))];
	const art = artworkIds.length
		? await db
				.select({ id: artwork.id, images: artwork.images })
				.from(artwork)
				.where(inArray(artwork.id, artworkIds))
		: [];
	const coverByArtwork = new Map(art.map((a) => [a.id, a.images[0] ?? null]));

	return {
		orders: orders.map((o) => ({
			id: o.id,
			buyerName: o.customerName,
			buyerEmail: o.customerEmail,
			addressLines: shippingAddressLines(o.shippingAddress),
			total: o.total,
			currency: o.currency,
			status: o.status,
			createdAt: o.createdAt,
			shippedAt: o.shippedAt,
			trackingNumber: o.trackingNumber,
			carrier: o.carrier,
			trackingUrl: o.trackingNumber ? trackingUrl(o.carrier, o.trackingNumber) : null,
			items: items
				.filter((i) => i.orderId === o.id)
				.map((i) => ({
					name: i.name,
					price: i.price,
					artworkId: i.artworkId,
					image: i.artworkId ? (coverByArtwork.get(i.artworkId) ?? null) : null
				}))
		}))
	};
};

export const actions: Actions = {
	markShipped: async ({ request, locals }) => {
		assertAdmin(locals);

		const formData = await request.formData();
		const orderId = formData.get('orderId')?.toString();
		const carrier = formData.get('carrier')?.toString().trim() ?? '';
		const trackingNumber = formData.get('trackingNumber')?.toString().trim();

		if (!orderId) {
			return fail(400, { error: 'Order ID is required' });
		}
		if (!trackingNumber) {
			return fail(400, { orderId, error: 'Tracking number is required' });
		}

		const [updated] = await db
			.update(order)
			.set({
				status: 'shipped',
				shippedAt: new Date(),
				trackingNumber,
				carrier: carrier || null
			})
			.where(eq(order.id, orderId))
			.returning();

		if (!updated) {
			return fail(404, { orderId, error: 'Order not found' });
		}

		// Tell the buyer — but a mail failure must not un-ship the order.
		let emailSent = false;
		try {
			const items = await db
				.select({ name: orderItem.name })
				.from(orderItem)
				.where(eq(orderItem.orderId, orderId));
			const email = buildShippedEmail({
				buyerName: updated.customerName,
				items,
				carrier: updated.carrier,
				trackingNumber
			});
			if (updated.customerEmail) {
				const result = await sendEmail({
					to: updated.customerEmail,
					subject: email.subject,
					text: email.text,
					html: email.html
				});
				emailSent = result.sent;
			}
		} catch (err) {
			console.error(`Failed to send shipped email for order ${orderId}:`, err);
		}

		return { success: true, orderId, emailSent };
	}
};
