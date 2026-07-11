<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types.js';
	import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js';
	import { deserialize } from '$app/forms';
	import { cart } from '$lib/stores/cart.svelte.js';
	import { formatPrice } from '$lib/utils.js';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ShoppingBag, ArrowLeft } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let embeddedCheckout: StripeEmbeddedCheckout | null = null;
	let checkoutError = $state<string | null>(null);
	let checkoutReady = $state(false);
	let isEmpty = $state(true);

	async function fetchClientSecret(): Promise<string> {
		const body = new FormData();
		body.set('artworkIds', JSON.stringify(cart.artworkIds));
		const existingSessionId = sessionStorage.getItem('dnt-checkout-session');
		if (existingSessionId) {
			body.set('existingSessionId', existingSessionId);
		}

		const response = await fetch('?/session', { method: 'POST', body });
		const result = deserialize(await response.text());

		if (result.type === 'success' && result.data?.clientSecret) {
			sessionStorage.setItem('dnt-checkout-session', String(result.data.sessionId));
			return String(result.data.clientSecret);
		}

		if (result.type === 'failure' && result.data?.message) {
			throw new Error(String(result.data.message));
		}

		throw new Error('Failed to start checkout. Please try again.');
	}

	onMount(async () => {
		isEmpty = cart.isEmpty;
		if (isEmpty) return;

		try {
			const stripe = await loadStripe(data.publishableKey);
			if (!stripe) {
				checkoutError = 'Failed to load the payment form. Please refresh the page.';
				return;
			}

			embeddedCheckout = await stripe.initEmbeddedCheckout({ fetchClientSecret });
			embeddedCheckout.mount('#checkout');
			checkoutReady = true;
		} catch (err) {
			checkoutError =
				err instanceof Error ? err.message : 'Failed to start checkout. Please try again.';
		}
	});

	onDestroy(() => {
		embeddedCheckout?.destroy();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<Button variant="ghost" class="mb-6" onclick={() => goto('/cart')}>
		<ArrowLeft class="mr-2 size-4" />
		Back to Cart
	</Button>

	{#if isEmpty}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<ShoppingBag class="size-12 mx-auto mb-4 text-muted-foreground" />
				<p class="text-lg font-medium mb-2">Your cart is empty</p>
				<p class="text-muted-foreground mb-6">Browse the gallery to find your piece</p>
				<Button onclick={() => goto('/products')}>Browse Gallery</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Embedded Stripe Checkout -->
			<div class="lg:col-span-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Checkout</Card.Title>
						<Card.Description>Complete your order without leaving the site</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if checkoutError}
							<div
								class="text-destructive text-sm mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20"
							>
								{checkoutError}
							</div>
							<Button variant="outline" onclick={() => goto('/cart')}>Review Cart</Button>
						{:else if !checkoutReady}
							<div class="text-muted-foreground text-sm p-4 border rounded-md">
								Loading secure checkout...
							</div>
						{/if}
						<div id="checkout"></div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Order Summary -->
			<div class="lg:col-span-1">
				<Card.Root class="sticky top-8">
					<Card.Header>
						<Card.Title>Order Summary</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-3">
							{#each cart.items as item (item.artworkId)}
								<div class="flex gap-3">
									{#if item.image}
										<div class="w-16 h-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
											<img src={item.image} alt={item.title} class="w-full h-full object-contain" />
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<h3 class="font-medium text-sm mb-1 truncate">{item.title}</h3>
										<p class="text-xs text-muted-foreground">
											{formatPrice(item.priceCents, 'usd')}
										</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="border-t pt-4 space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Subtotal</span>
								<span>{formatPrice(cart.total, 'usd')}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Items</span>
								<span>{cart.itemCount}</span>
							</div>
						</div>
						<div class="border-t pt-4">
							<div class="flex justify-between text-lg font-semibold">
								<span>Total</span>
								<span>{formatPrice(cart.total, 'usd')}</span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	{/if}
</div>
