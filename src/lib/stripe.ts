import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

// Initialize Stripe only if the key is available
// This allows the build to complete even if env vars aren't set during build
const stripeSecretKey = env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
	console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
}

export const stripe = stripeSecretKey
	? new Stripe(stripeSecretKey, {
			typescript: true
		})
	: ({} as Stripe); // Empty object fallback for build time

