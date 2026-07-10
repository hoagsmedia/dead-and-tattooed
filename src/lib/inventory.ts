import { and, eq, inArray, ne } from 'drizzle-orm';
import { stripe } from '$lib/stripe.js';
import { db } from '$lib/index.js';
import { artwork, order, orderItem } from '../db/schema.js';

/**
 * One-of-a-kind inventory helpers.
 * Storefront catalog is Stripe products (`active`); local `artwork.published` is kept in sync when IDs align.
 */

export async function assertProductsAvailable(productIds: string[]): Promise<void> {
	const uniqueIds = [...new Set(productIds.filter(Boolean))];
	if (uniqueIds.length === 0) return;

	for (const productId of uniqueIds) {
		const product = await stripe.products.retrieve(productId);
		if (!product.active || product.metadata?.sold === 'true') {
			throw new Error(`"${product.name}" is no longer available.`);
		}
	}

	await assertNotSoldInCompletedOrders(uniqueIds);
}

/**
 * Post-payment check: allow the current PaymentIntent to finish even if webhook
 * already deactivated the Stripe product, but block if another completed order owns it.
 */
export async function assertNotSoldToSomeoneElse(
	productIds: string[],
	paymentIntentId: string
): Promise<void> {
	const uniqueIds = [...new Set(productIds.filter(Boolean))];
	if (uniqueIds.length === 0) return;

	await assertNotSoldInCompletedOrders(uniqueIds, paymentIntentId);
}

async function assertNotSoldInCompletedOrders(
	productIds: string[],
	excludePaymentIntentId?: string
): Promise<void> {
	const conditions = [inArray(orderItem.productId, productIds), eq(order.status, 'completed')];
	if (excludePaymentIntentId) {
		conditions.push(ne(order.paymentIntentId, excludePaymentIntentId));
	}

	const soldRows = await db
		.select({ productId: orderItem.productId })
		.from(orderItem)
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.where(and(...conditions));

	if (soldRows.length > 0) {
		throw new Error(`One or more pieces in your cart have already been sold.`);
	}
}

export async function markProductsSold(productIds: string[]): Promise<void> {
	const uniqueIds = [...new Set(productIds.filter(Boolean))];
	if (uniqueIds.length === 0) return;

	const artworkIds = new Set<string>(uniqueIds);

	await Promise.all(
		uniqueIds.map(async (productId) => {
			try {
				const product = await stripe.products.retrieve(productId);
				if (product.metadata?.artworkId) {
					artworkIds.add(product.metadata.artworkId);
				}
				await stripe.products.update(productId, {
					active: false,
					metadata: {
						...product.metadata,
						sold: 'true',
						soldAt: new Date().toISOString()
					}
				});
			} catch (err) {
				console.error(`Failed to mark Stripe product ${productId} as sold:`, err);
			}
		})
	);

	try {
		await db
			.update(artwork)
			.set({ published: false })
			.where(inArray(artwork.id, [...artworkIds]));
	} catch (err) {
		console.error('Failed to unpublish local artwork after sale:', err);
	}
}
