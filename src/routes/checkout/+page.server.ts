import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { checkoutSchema } from './schema.js';
import { stripe } from '$lib/stripe.js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { db } from '$lib/index.js';
import { order, orderItem } from '../../db/schema.js';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ url }) => {
	// Get cart items from query params (only priceId, productId, quantity - no prices!)
	const cartData = url.searchParams.get('cart');
	let cartItems: Array<{
		productId: string;
		priceId: string;
		quantity: number;
	}> = [];

	if (cartData) {
		try {
			cartItems = JSON.parse(cartData);
		} catch (e) {
			console.error('Failed to parse cart data:', e);
			throw redirect(302, '/products');
		}
	}

	if (cartItems.length === 0) {
		throw redirect(302, '/products');
	}

	// SECURITY: Fetch and validate prices from Stripe API
	// This prevents price manipulation attacks
	const validatedItems: Array<{
		productId: string;
		priceId: string;
		name: string;
		image: string | null;
		price: number;
		currency: string;
		quantity: number;
	}> = [];

	try {
		// Fetch all prices from Stripe and validate them
		for (const item of cartItems) {
			// Fetch the price from Stripe
			const price = await stripe.prices.retrieve(item.priceId);

			// Validate that the price exists and is active
			if (!price || !price.active) {
				console.error(`Price ${item.priceId} is not active or does not exist`);
				throw error(400, 'Invalid price selected. Please refresh and try again.');
			}

			// Validate that the price belongs to the specified product
			if (price.product !== item.productId) {
				console.error(`Price ${item.priceId} does not belong to product ${item.productId}`);
				throw error(400, 'Price mismatch detected. Please refresh and try again.');
			}

			// Fetch the product to get the name and image
			const product = await stripe.products.retrieve(item.productId);

			// Validate quantity
			const quantity = Math.max(1, Math.min(item.quantity || 1, 100)); // Clamp between 1 and 100

			// Calculate line item total (price is in cents, quantity is a number)
			const lineItemTotal = (price.unit_amount || 0) * quantity;

			validatedItems.push({
				productId: item.productId,
				priceId: item.priceId,
				name: product.name,
				image: product.images && product.images.length > 0 ? product.images[0] : null,
				price: lineItemTotal, // Total for this line item (price * quantity)
				currency: price.currency,
				quantity
			});
		}
	} catch (err) {
		console.error('Error validating prices:', err);
		if (err instanceof Error && err.message.includes('No such price')) {
			throw error(400, 'Invalid price selected. Please refresh and try again.');
		}
		// Re-throw if it's already an error response
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to validate cart items. Please try again.');
	}

	// Calculate total from validated prices
	const total = validatedItems.reduce((sum, item) => sum + item.price, 0);
	const currency = validatedItems[0]?.currency || 'usd';

	// Validate all items use the same currency
	const allSameCurrency = validatedItems.every((item) => item.currency === currency);
	if (!allSameCurrency) {
		throw error(400, 'All items must use the same currency.');
	}

	// Create PaymentIntent
	let clientSecret: string;
	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: total, // Amount is already in cents
			currency: currency.toLowerCase(),
			automatic_payment_methods: {
				enabled: true
			},
			metadata: {
				cartItems: JSON.stringify(
					validatedItems.map((item) => ({
						productId: item.productId,
						priceId: item.priceId,
						name: item.name,
						price: item.price,
						currency: item.currency,
						quantity: item.quantity
					}))
				)
			}
		});

		clientSecret = paymentIntent.client_secret || '';
	} catch (err) {
		console.error('Error creating PaymentIntent:', err);
		throw error(500, 'Failed to initialize payment');
	}

	// Get Stripe publishable key from environment
	const publishableKey = publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY;

	if (!publishableKey) {
		throw error(500, 'Stripe publishable key is not configured');
	}

	return {
		checkoutForm: await superValidate(zod4(checkoutSchema)),
		clientSecret,
		publishableKey,
		cartItems: validatedItems
	};
};

export const actions: Actions = {
	checkout: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(checkoutSchema));

		if (!form.valid) {
			return fail(400, {
				checkoutForm: form
			});
		}

		// Get payment intent ID from form data (set by client after payment confirmation)
		const paymentIntentId = formData.get('paymentIntentId') as string | null;

		if (!paymentIntentId) {
			return fail(400, {
				checkoutForm: {
					...form,
					errors: {
						...form.errors,
						_email: ['Payment intent not found']
					}
				}
			});
		}

		try {
			// Retrieve and verify the payment intent
			const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

			console.log('Payment intent status on server:', paymentIntent.status);

			// Accept both 'succeeded' and 'requires_capture' statuses
			// 'requires_capture' means payment is authorized but not yet captured
			// For most use cases, we can treat this as successful
			if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture') {
				console.error('Payment intent in invalid status:', paymentIntent.status);
				return fail(400, {
					checkoutForm: {
						...form,
						errors: {
							...form.errors,
							_email: [`Payment status is ${paymentIntent.status}. Payment was not successful.`]
						}
					}
				});
			}

			// Update payment intent with customer and shipping information
			await stripe.paymentIntents.update(paymentIntentId, {
				shipping: {
					name: form.data.name,
					address: {
						line1: form.data.shippingStreet,
						city: form.data.shippingCity,
						state: form.data.shippingState,
						postal_code: form.data.shippingZip,
						country: form.data.shippingCountry.toUpperCase()
					},
					phone: form.data.phone
				},
				metadata: {
					...paymentIntent.metadata,
					customerName: form.data.name,
					customerEmail: form.data.email,
					customerPhone: form.data.phone || '',
					billingAddress: form.data.useShippingForBilling
						? JSON.stringify({
								street: form.data.shippingStreet,
								city: form.data.shippingCity,
								state: form.data.shippingState,
								zip: form.data.shippingZip,
								country: form.data.shippingCountry
							})
						: JSON.stringify({
								street: form.data.billingStreet,
								city: form.data.billingCity,
								state: form.data.billingState,
								zip: form.data.billingZip,
								country: form.data.billingCountry
							})
				}
			});

			// Parse cart items from payment intent metadata
			let cartItems: Array<{
				productId: string;
				priceId: string;
				name: string;
				price: number;
				currency: string;
				quantity: number;
			}> = [];
			try {
				if (paymentIntent.metadata.cartItems) {
					cartItems = JSON.parse(paymentIntent.metadata.cartItems);
				}
			} catch (e) {
				console.error('Failed to parse cart items from payment intent:', e);
			}

			// Prepare addresses
			const shippingAddress = JSON.stringify({
				street: form.data.shippingStreet,
				city: form.data.shippingCity,
				state: form.data.shippingState,
				zip: form.data.shippingZip,
				country: form.data.shippingCountry
			});

			const billingAddress = form.data.useShippingForBilling
				? shippingAddress
				: JSON.stringify({
						street: form.data.billingStreet,
						city: form.data.billingCity,
						state: form.data.billingState,
						zip: form.data.billingZip,
						country: form.data.billingCountry
					});

			// Create order in database
			const orderId = nanoid();
			const orderTotal = paymentIntent.amount / 100; // Convert from cents
			const orderCurrency = paymentIntent.currency.toUpperCase();

			await db.insert(order).values({
				id: orderId,
				paymentIntentId: paymentIntent.id,
				customerName: form.data.name,
				customerEmail: form.data.email,
				customerPhone: form.data.phone || null,
				shippingAddress,
				billingAddress,
				total: orderTotal.toString(),
				currency: orderCurrency,
				status: 'completed'
			});

			// Create order items from cart items
			if (cartItems.length > 0) {
				await db.insert(orderItem).values(
					cartItems.map((item) => ({
						id: nanoid(),
						orderId,
						productId: item.productId,
						priceId: item.priceId,
						name: item.name,
						price: (item.price / 100).toString(), // Convert from cents
						currency: item.currency.toUpperCase()
					}))
				);
			}

			// Payment successful - order is complete
			// Cart will be cleared on client side

			return {
				checkoutForm: form,
				success: true,
				paymentIntentId: paymentIntent.id,
				orderId
			};
		} catch (err) {
			console.error('Error processing checkout:', err);
			return fail(500, {
				checkoutForm: {
					...form,
					errors: {
						...form.errors,
						_email: [err instanceof Error ? err.message : 'Payment processing failed']
					}
				}
			});
		}
	}
};
