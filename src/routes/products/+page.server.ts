import type { PageServerLoad } from './$types.js';
import { stripe } from '$lib/stripe.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	try {
		// Fetch products with their prices
		const products = await stripe.products.list({
			active: true,
			expand: ['data.default_price']
		});

		// Fetch prices for all products
		const productsWithPrices = await Promise.all(
			products.data.map(async (product) => {
				const prices = await stripe.prices.list({
					product: product.id,
					active: true
				});

				return {
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
				};
			})
		);

		return {
			products: productsWithPrices
		};
	} catch (err) {
		console.error('Error fetching Stripe products:', err);
		throw error(500, 'Failed to load products');
	}
};

