import type { PageServerLoad } from './$types.js';
import { stripe } from '$lib/stripe.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const productId = params.id;

		// Fetch the product
		const product = await stripe.products.retrieve(productId, {
			expand: ['default_price']
		});

		// Fetch all active prices for this product
		const prices = await stripe.prices.list({
			product: productId,
			active: true
		});

		return {
			product: {
				id: product.id,
				name: product.name,
				description: product.description,
				images: product.images,
				metadata: product.metadata,
				prices: prices.data.map((price) => ({
					id: price.id,
					amount: price.unit_amount,
					currency: price.currency,
					recurring: price.recurring
						? {
								interval: price.recurring.interval,
								interval_count: price.recurring.interval_count
							}
						: null
				}))
			}
		};
	} catch (err) {
		console.error('Error fetching Stripe product:', err);
		throw error(404, 'Product not found');
	}
};
