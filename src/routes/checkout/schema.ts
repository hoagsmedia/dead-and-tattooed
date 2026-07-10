import { z } from 'zod';

const addressSchema = z.object({
	street: z.string().min(1, 'Street address is required'),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	zip: z.string().min(1, 'ZIP code is required'),
	country: z.string().min(1, 'Country is required').default('US')
});

export const checkoutSchema = z
	.object({
		// Customer Information
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.email('Invalid email address'),
		phone: z.string().min(10, 'Phone number is required').optional(),

		// Shipping Address
		shippingStreet: z.string().min(1, 'Shipping street address is required'),
		shippingCity: z.string().min(1, 'Shipping city is required'),
		shippingState: z.string().min(1, 'Shipping state is required'),
		shippingZip: z.string().min(1, 'Shipping ZIP code is required'),
		shippingCountry: z.string().min(1, 'Shipping country is required').default('US'),

		// Billing Address
		useShippingForBilling: z.boolean().default(false),
		billingStreet: z.string().optional(),
		billingCity: z.string().optional(),
		billingState: z.string().optional(),
		billingZip: z.string().optional(),
		billingCountry: z.string().default('US').optional()
	})
	.refine(
		(data) => {
			// If not using shipping for billing, billing address fields are required
			if (!data.useShippingForBilling) {
				return !!(
					data.billingStreet &&
					data.billingCity &&
					data.billingState &&
					data.billingZip &&
					data.billingCountry
				);
			}
			return true;
		},
		{
			message: 'Billing address is required when not using shipping address',
			path: ['billingStreet']
		}
	);

export type CheckoutSchema = typeof checkoutSchema;
