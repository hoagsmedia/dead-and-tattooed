import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { stripe } from '$lib/stripe.js';
import { env } from '$env/dynamic/private';
import { db } from '$lib/index.js';
import { order, orderItem } from '../../../../db/schema.js';
import { markProductsSold } from '$lib/inventory.js';
import { eq } from 'drizzle-orm';

/**
 * Stripe Webhook Handler
 *
 * For local development, use Stripe CLI to forward webhooks:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Login: `stripe login`
 * 3. Forward webhooks: `stripe listen --forward-to localhost:5173/api/stripe/webhook`
 * 4. Copy the webhook signing secret (starts with whsec_) and add it to your .env as STRIPE_WEBHOOK_SECRET
 *
 * For production, configure the webhook endpoint in Stripe Dashboard and use the production webhook secret.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		console.error('Missing stripe-signature header');
		throw error(400, 'Missing stripe-signature header');
	}

	// Use Stripe CLI webhook secret for local development
	// Get this by running: stripe listen --forward-to localhost:5173/api/stripe/webhook
	const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

	if (!webhookSecret) {
		console.error('STRIPE_WEBHOOK_SECRET is not configured');
		console.error(
			'For local development, run: stripe listen --forward-to localhost:5173/api/stripe/webhook'
		);
		throw error(500, 'STRIPE_WEBHOOK_SECRET is not configured. Use Stripe CLI for local testing.');
	}

	let event;
	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		console.error(
			'Make sure you are using the correct webhook secret from Stripe CLI or Dashboard'
		);
		throw error(400, 'Webhook signature verification failed');
	}

	// Handle the event
	switch (event.type) {
		case 'payment_intent.created': {
			// Payment intent was created - this is normal, no action needed
			console.log('Payment intent created:', event.data.object.id);
			break;
		}
		case 'payment_intent.succeeded': {
			const paymentIntent = event.data.object;
			console.log('Payment intent succeeded:', paymentIntent.id);
			// Update order status to completed if it exists
			try {
				await db
					.update(order)
					.set({ status: 'completed' })
					.where(eq(order.paymentIntentId, paymentIntent.id));
				console.log('Order status updated to completed for payment intent:', paymentIntent.id);
			} catch (err) {
				console.error('Error updating order status:', err);
				// Don't fail the webhook - order might not exist yet if webhook fires before form submission
			}

			// Mark one-of-a-kind pieces sold (Stripe inactive + local artwork unpublished when linked)
			try {
				const productIds = new Set<string>();

				if (paymentIntent.metadata?.cartItems) {
					try {
						const cartItems = JSON.parse(paymentIntent.metadata.cartItems) as Array<{
							productId?: string;
						}>;
						for (const item of cartItems) {
							if (item.productId) productIds.add(item.productId);
						}
					} catch (e) {
						console.error('Failed to parse cartItems metadata in webhook:', e);
					}
				}

				const orderRows = await db
					.select({ id: order.id })
					.from(order)
					.where(eq(order.paymentIntentId, paymentIntent.id))
					.limit(1);

				if (orderRows[0]) {
					const items = await db
						.select({ productId: orderItem.productId })
						.from(orderItem)
						.where(eq(orderItem.orderId, orderRows[0].id));
					for (const item of items) productIds.add(item.productId);
				}

				if (productIds.size > 0) {
					await markProductsSold([...productIds]);
				}
			} catch (err) {
				console.error('Failed to mark products sold in webhook:', err);
			}
			break;
		}
		case 'payment_intent.payment_failed': {
			const paymentIntent = event.data.object;
			console.log('Payment intent failed:', paymentIntent.id);
			// Update order status to cancelled if it exists
			try {
				await db
					.update(order)
					.set({ status: 'cancelled' })
					.where(eq(order.paymentIntentId, paymentIntent.id));
			} catch (err) {
				console.error('Error updating order status:', err);
			}
			break;
		}
		case 'charge.succeeded':
		case 'charge.updated': {
			// These events are informational - payment_intent.succeeded is the primary event we use
			console.log(`Charge event received: ${event.type}`, (event.data.object as any).id);
			break;
		}
		default:
			console.log(`Unhandled event type: ${event.type}`);
	}

	return json({ received: true });
};
