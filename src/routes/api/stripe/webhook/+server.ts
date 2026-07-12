import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import type Stripe from 'stripe';
import { stripe } from '$lib/stripe.js';
import { env } from '$env/dynamic/private';
import { db } from '$lib/index.js';
import { artwork, order, orderItem } from '../../../../db/schema.js';
import { markArtworksSold, releaseReservations } from '$lib/inventory.js';
import { adminEmails } from '$lib/server/admin.js';
import { sendEmail } from '$lib/server/email.js';
import { buildNewOrderEmail, type OrderEmailItem } from '$lib/server/order-emails.js';
import { inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

function parseArtworkIds(session: Stripe.Checkout.Session): string[] {
	try {
		const parsed = JSON.parse(session.metadata?.artworkIds ?? '[]');
		return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
	} catch (e) {
		console.error('Failed to parse artworkIds metadata:', e);
		return [];
	}
}

function addressToJson(address: Stripe.Address | null | undefined): string {
	return JSON.stringify({
		street: [address?.line1, address?.line2].filter(Boolean).join(', '),
		city: address?.city ?? '',
		state: address?.state ?? '',
		zip: address?.postal_code ?? '',
		country: address?.country ?? ''
	});
}

/**
 * Tell the artist a piece sold. Best-effort: failures are logged per address
 * and never propagate (the webhook must ack Stripe regardless).
 */
async function notifyOwners(
	orderDetails: Omit<Parameters<typeof buildNewOrderEmail>[0], 'ordersUrl'>
): Promise<void> {
	const recipients = adminEmails();
	if (recipients.length === 0) {
		console.warn('ADMIN_EMAILS is empty — skipping new-order notification');
		return;
	}

	const baseUrl = (env.BETTER_AUTH_URL || 'https://deadandtattooed.com').replace(/\/$/, '');
	const email = buildNewOrderEmail({ ...orderDetails, ordersUrl: `${baseUrl}/dashboard/orders` });

	const results = await Promise.allSettled(
		recipients.map((to) =>
			sendEmail({ to, subject: email.subject, text: email.text, html: email.html })
		)
	);
	results.forEach((result, i) => {
		if (result.status === 'rejected') {
			console.error(`Failed to email new-order notification to ${recipients[i]}:`, result.reason);
		}
	});
}

/**
 * Money has moved when this runs, so DB failures must NOT be swallowed:
 * throwing bubbles to a 500, Stripe retries, and every write here is
 * idempotent (status update + insert with a unique paymentIntentId).
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
	const artworkIds = parseArtworkIds(session);

	// Mark the pieces sold (idempotent) — they stay published so the gallery
	// can keep showing them with a SOLD badge.
	if (artworkIds.length > 0) {
		await markArtworksSold(db, artworkIds);
	}

	const paymentIntentId =
		typeof session.payment_intent === 'string'
			? session.payment_intent
			: (session.payment_intent?.id ?? session.id);

	const shipping = session.collected_information?.shipping_details ?? null;
	const customerName = session.customer_details?.name ?? shipping?.name ?? 'Unknown';
	const shippingAddress = addressToJson(shipping?.address);
	const billingAddress = session.customer_details?.address
		? addressToJson(session.customer_details.address)
		: shippingAddress;

	// Order + items land atomically: a retry after a partial failure would
	// otherwise hit the paymentIntentId conflict and leave the order item-less.
	const { orderId, emailItems } = await db.transaction(async (tx) => {
		// Idempotency: paymentIntentId is unique, so a webhook retry is a no-op
		const inserted = await tx
			.insert(order)
			.values({
				id: nanoid(),
				paymentIntentId,
				customerName,
				customerEmail: session.customer_details?.email ?? '',
				customerPhone: session.customer_details?.phone ?? null,
				shippingAddress,
				billingAddress,
				total: ((session.amount_total ?? 0) / 100).toString(),
				currency: (session.currency ?? 'usd').toUpperCase(),
				status: 'completed'
			})
			.onConflictDoNothing({ target: order.paymentIntentId })
			.returning({ id: order.id });

		const orderId = inserted[0]?.id;
		const emailItems: OrderEmailItem[] = [];

		if (orderId && artworkIds.length > 0) {
			const pieces = await tx.select().from(artwork).where(inArray(artwork.id, artworkIds));
			const piecesById = new Map(pieces.map((piece) => [piece.id, piece]));

			await tx.insert(orderItem).values(
				artworkIds.map((artworkId) => {
					const piece = piecesById.get(artworkId);
					const name = piece?.title ?? 'Artwork';
					const price = piece?.price ?? '0';
					emailItems.push({ name, price });
					return {
						id: nanoid(),
						orderId,
						productId: artworkId,
						priceId: 'inline',
						artworkId,
						name,
						price,
						currency: (session.currency ?? 'usd').toUpperCase()
					};
				})
			);
		}

		return { orderId, emailItems };
	});

	console.log('Order recorded for checkout session:', session.id);

	// Only on first insert (orderId is undefined on webhook retries), and
	// never let a mail hiccup bounce the webhook back to Stripe.
	if (orderId) {
		try {
			await notifyOwners({
				items: emailItems,
				buyerName: customerName,
				buyerEmail: session.customer_details?.email ?? '',
				shippingAddress,
				total: ((session.amount_total ?? 0) / 100).toFixed(2),
				currency: (session.currency ?? 'usd').toUpperCase()
			});
		} catch (err) {
			console.error('Failed to send new-order notification:', err);
		}
	}
}

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

	// Handle the event. DB failures become a 500 so Stripe retries — every
	// handler is idempotent, and silently acking a lost order would strand a
	// paid buyer with no order row.
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				console.log('Checkout session completed:', session.id);
				await handleCheckoutSessionCompleted(session);
				break;
			}
			case 'checkout.session.expired': {
				const session = event.data.object;
				console.log('Checkout session expired:', session.id);
				// The buyer abandoned checkout — give the pieces back (only ones still reserved)
				await releaseReservations(db, parseArtworkIds(session));
				break;
			}
			default:
				console.log(`Unhandled event type: ${event.type}`);
		}
	} catch (err) {
		console.error(`Webhook handler failed for ${event.type}:`, err);
		throw error(500, 'Webhook handler failed');
	}

	return json({ received: true });
};
