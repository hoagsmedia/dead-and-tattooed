import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/index.js';
import { order, orderItem } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const paymentIntentId = url.searchParams.get('payment_intent');
	const orderId = url.searchParams.get('order_id');

	if (!paymentIntentId && !orderId) {
		// If no order info, redirect to products
		throw redirect(302, '/products');
	}

	try {
		let orderData;

		if (orderId) {
			// Load by order ID using select
			const [foundOrder] = await db.select().from(order).where(eq(order.id, orderId)).limit(1);

			if (!foundOrder) {
				throw error(404, 'Order not found');
			}

			// Load order items
			const items = await db.select().from(orderItem).where(eq(orderItem.orderId, orderId));

			orderData = {
				...foundOrder,
				items
			};
		} else if (paymentIntentId) {
			// Load by payment intent ID using select
			const [foundOrder] = await db
				.select()
				.from(order)
				.where(eq(order.paymentIntentId, paymentIntentId))
				.limit(1);

			if (!foundOrder) {
				throw error(404, 'Order not found');
			}

			// Load order items
			const items = await db.select().from(orderItem).where(eq(orderItem.orderId, foundOrder.id));

			orderData = {
				...foundOrder,
				items
			};
		}

		if (!orderData) {
			console.error('Order not found:', { orderId, paymentIntentId });
			throw error(404, 'Order not found');
		}

		// Parse addresses from JSON strings
		let shippingAddress, billingAddress;
		try {
			shippingAddress = JSON.parse(orderData.shippingAddress);
			billingAddress = JSON.parse(orderData.billingAddress);
		} catch (parseErr) {
			console.error('Error parsing addresses:', parseErr);
			throw error(500, 'Invalid order data');
		}

		return {
			order: {
				...orderData,
				shippingAddress,
				billingAddress,
				items: orderData.items || []
			}
		};
	} catch (err) {
		console.error('Error loading order:', err);
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load order details');
	}
};
