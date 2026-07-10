<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { checkoutSchema, type CheckoutSchema } from './schema.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { cart } from '$lib/stores/cart.svelte.js';
	import { goto } from '$app/navigation';
	let {
		data,
		clientSecret,
		publishableKey
	}: {
		data: { checkoutForm: SuperValidated<Infer<CheckoutSchema>> };
		clientSecret: string | null;
		publishableKey: string | null;
	} = $props();

	const form = superForm(data.checkoutForm, {
		validators: zod4Client(checkoutSchema),
		onSubmit: async ({ cancel, formData: fd }) => {
			// Confirm payment with Stripe before submitting
			if (!stripe || !elements || !paymentElement) {
				stripeError = 'Payment form is not ready. Please wait.';
				cancel();
				return;
			}

			// Get form values from FormData
			const useShippingForBilling =
				fd.get('useShippingForBilling') === 'true' || fd.get('useShippingForBilling') === 'on';
			const name = (fd.get('name') as string) || '';
			const email = (fd.get('email') as string) || '';
			const phone = (fd.get('phone') as string) || '';
			const shippingStreet = (fd.get('shippingStreet') as string) || '';
			const shippingCity = (fd.get('shippingCity') as string) || '';
			const shippingState = (fd.get('shippingState') as string) || '';
			const shippingZip = (fd.get('shippingZip') as string) || '';
			const shippingCountry = (fd.get('shippingCountry') as string) || 'US';
			const billingStreet = (fd.get('billingStreet') as string) || '';
			const billingCity = (fd.get('billingCity') as string) || '';
			const billingState = (fd.get('billingState') as string) || '';
			const billingZip = (fd.get('billingZip') as string) || '';
			const billingCountry = (fd.get('billingCountry') as string) || 'US';

			// Confirm payment with Stripe
			const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					payment_method_data: {
						billing_details: {
							name,
							email,
							phone: phone || undefined,
							address: {
								line1: useShippingForBilling ? shippingStreet : billingStreet,
								city: useShippingForBilling ? shippingCity : billingCity,
								state: useShippingForBilling ? shippingState : billingState,
								postal_code: useShippingForBilling ? shippingZip : billingZip,
								country: (useShippingForBilling ? shippingCountry : billingCountry).toUpperCase()
							}
						}
					}
				},
				redirect: 'if_required'
			});

			if (confirmError) {
				stripeError = confirmError.message || 'Payment failed. Please try again.';
				cancel();
				return;
			}

			if (!paymentIntent) {
				stripeError = 'Payment confirmation failed. Please try again.';
				cancel();
				return;
			}

			// If payment requires redirect (3D Secure, etc.), Stripe will handle it
			if (paymentIntent.status === 'requires_action') {
				cancel(); // Stripe will redirect
				return;
			}

			// If payment succeeded or requires capture, add payment intent ID to form data
			if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
				confirmedPaymentIntentId = paymentIntent.id;
				// Add paymentIntentId to FormData so it's submitted to the server
				fd.append('paymentIntentId', paymentIntent.id);
				// Don't cancel - let the form submit normally
			} else {
				stripeError = `Payment status: ${paymentIntent.status}. Please try again.`;
				cancel();
			}
		},
		onUpdated: ({ form: f }) => {
			if (f.valid) {
				// Form was successfully submitted - reset form, clear cart and redirect
				reset();
				cart.clear();
				if (confirmedPaymentIntentId) {
					goto(`/checkout/success?payment_intent=${confirmedPaymentIntentId}`);
				} else {
					goto('/checkout/success');
				}
			}
		}
	});

	const { form: formData, enhance, submitting, errors, reset } = form;

	let stripe: Stripe | null = $state(null);
	let elements: StripeElements | null = $state(null);
	let paymentElement: any = $state(null);
	let stripeError: string | null = $state(null);
	let stripeLoaded = $state(false);
	let confirmedPaymentIntentId: string | null = $state(null);
	let isSyncingBilling = $state(false);

	onMount(async () => {
		if (!clientSecret) {
			stripeError = 'Payment initialization failed. Please refresh the page.';
			return;
		}

		// Load Stripe
		if (!publishableKey) {
			stripeError = 'Stripe publishable key is not configured.';
			return;
		}

		try {
			stripe = await loadStripe(publishableKey);
			if (!stripe) {
				stripeError = 'Failed to load Stripe.';
				return;
			}

			// Ensure the DOM element exists before creating elements
			const paymentElementContainer = document.getElementById('payment-element');
			if (!paymentElementContainer) {
				stripeError = 'Payment form container not found.';
				return;
			}

			elements = stripe.elements({
				clientSecret,
				appearance: {
					theme: 'stripe'
				}
			});

			paymentElement = elements.create('payment');

			// Register event handlers to prevent onMessage warnings
			paymentElement.on('ready', () => {
				// Payment element is ready - this helps prevent onMessage warnings
			});

			paymentElement.on('change', (event: any) => {
				// Handle payment element changes
				if (event.error) {
					stripeError = event.error.message;
				} else {
					stripeError = null;
				}
			});

			paymentElement.mount('#payment-element');
			stripeLoaded = true;
		} catch (error) {
			console.error('Error initializing Stripe:', error);
			stripeError = 'Failed to initialize payment form.';
		}
	});

	// Manual sync function to copy shipping to billing
	function syncBillingToShipping() {
		if (isSyncingBilling) return;

		isSyncingBilling = true;
		// Read shipping values without tracking
		const street = untrack(() => $formData.shippingStreet);
		const city = untrack(() => $formData.shippingCity);
		const state = untrack(() => $formData.shippingState);
		const zip = untrack(() => $formData.shippingZip);
		const country = untrack(() => $formData.shippingCountry);

		// Write billing values without tracking
		untrack(() => {
			$formData.billingStreet = street;
			$formData.billingCity = city;
			$formData.billingState = state;
			$formData.billingZip = zip;
			$formData.billingCountry = country;
		});
		// Reset flag asynchronously
		queueMicrotask(() => {
			isSyncingBilling = false;
		});
	}

	// Only watch checkbox state - sync when it becomes true
	// We don't watch shipping fields to avoid infinite loops
	// Users can uncheck and recheck the box to re-sync if they change shipping after checking
	// This avoids tracking shipping fields which causes infinite loops
	let previousCheckboxState = $state(false);
	$effect(() => {
		const currentState = $formData.useShippingForBilling;
		if (currentState && !previousCheckboxState) {
			// Checkbox was just checked - sync once
			syncBillingToShipping();
		}
		previousCheckboxState = currentState;
	});
</script>

<form method="POST" action="?/checkout" use:enhance>
	<!-- Customer Information -->
	<div class="space-y-4 mb-6">
		<h2 class="text-xl font-semibold">Customer Information</h2>
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Full Name</Form.Label>
					<Input {...props} bind:value={$formData.name} placeholder="John Doe" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="email">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email</Form.Label>
					<Input
						{...props}
						type="email"
						bind:value={$formData.email}
						placeholder="john@example.com"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="phone">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Phone (Optional)</Form.Label>
					<Input {...props} type="tel" bind:value={$formData.phone} placeholder="(555) 123-4567" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<!-- Shipping Address -->
	<div class="space-y-4 mb-6">
		<h2 class="text-xl font-semibold">Shipping Address</h2>
		<Form.Field {form} name="shippingStreet">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Street Address</Form.Label>
					<Input {...props} bind:value={$formData.shippingStreet} placeholder="123 Main St" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="grid grid-cols-2 gap-4">
			<Form.Field {form} name="shippingCity">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>City</Form.Label>
						<Input {...props} bind:value={$formData.shippingCity} placeholder="New York" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="shippingState">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>State</Form.Label>
						<Input {...props} bind:value={$formData.shippingState} placeholder="NY" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Form.Field {form} name="shippingZip">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>ZIP Code</Form.Label>
						<Input {...props} bind:value={$formData.shippingZip} placeholder="10001" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="shippingCountry">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Country</Form.Label>
						<Input {...props} bind:value={$formData.shippingCountry} placeholder="US" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>

	<!-- Billing Address -->
	<div class="space-y-4 mb-6">
		<h2 class="text-xl font-semibold">Billing Address</h2>
		<Form.Field {form} name="useShippingForBilling">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex items-center space-x-2">
						<Checkbox
							{...props}
							bind:checked={$formData.useShippingForBilling}
							id="useShippingForBilling"
						/>
						<Form.Label for="useShippingForBilling" class="mt-0! cursor-pointer">
							Use shipping address for billing
						</Form.Label>
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		{#if !$formData.useShippingForBilling}
			<Form.Field {form} name="billingStreet">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Street Address</Form.Label>
						<Input {...props} bind:value={$formData.billingStreet} placeholder="123 Main St" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field {form} name="billingCity">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>City</Form.Label>
							<Input {...props} bind:value={$formData.billingCity} placeholder="New York" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="billingState">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>State</Form.Label>
							<Input {...props} bind:value={$formData.billingState} placeholder="NY" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field {form} name="billingZip">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>ZIP Code</Form.Label>
							<Input {...props} bind:value={$formData.billingZip} placeholder="10001" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="billingCountry">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Country</Form.Label>
							<Input {...props} bind:value={$formData.billingCountry} placeholder="US" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		{/if}
	</div>

	<!-- Payment Information -->
	<div class="space-y-4 mb-6">
		<h2 class="text-xl font-semibold">Payment Information</h2>
		{#if stripeError}
			<div
				class="text-destructive text-sm mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20"
			>
				{stripeError}
			</div>
		{/if}
		{#if !stripeLoaded}
			<div class="text-muted-foreground text-sm p-4 border rounded-md">Loading payment form...</div>
		{/if}
		<div id="payment-element" class="mb-4 p-4 border rounded-md min-h-[200px]"></div>
	</div>

	<Form.Button type="submit" disabled={$submitting || !stripeLoaded}>
		{$submitting ? 'Processing...' : 'Complete Order'}
	</Form.Button>
</form>
