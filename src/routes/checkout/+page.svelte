<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import { cart } from '$lib/stores/cart.svelte.js';
	import { formatPrice } from '$lib/utils.js';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ShoppingBag, ArrowLeft } from '@lucide/svelte';
	import CheckoutForm from './checkout-form.svelte';

	let { data }: { data: PageData } = $props();

	let cartItems = $state(data.cartItems || []);

	onMount(() => {
		// Ensure cart data is available, redirect if empty
		if (cart.isEmpty && cartItems.length === 0) {
			goto('/products');
		}

		// Sync cart items with localStorage cart for consistency
		if (cart.items.length > 0 && cartItems.length === 0) {
			cartItems = cart.items;
		}
	});

	const total = $derived(cartItems.reduce((sum, item) => sum + item.price, 0));

	const totalCurrency = $derived(cartItems.length === 0 ? 'USD' : cartItems[0].currency);
</script>

<div class="container mx-auto px-4 py-8">
	<Button variant="ghost" class="mb-6" onclick={() => goto('/products')}>
		<ArrowLeft class="mr-2 size-4" />
		Back to Products
	</Button>

	{#if cartItems.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<ShoppingBag class="size-12 mx-auto mb-4 text-muted-foreground" />
				<p class="text-lg font-medium mb-2">Your cart is empty</p>
				<p class="text-muted-foreground mb-6">Start adding products to your cart</p>
				<Button onclick={() => goto('/products')}>Browse Products</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Checkout Form -->
			<div class="lg:col-span-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Checkout</Card.Title>
						<Card.Description>Enter your information to complete your order</Card.Description>
					</Card.Header>
					<Card.Content>
						<CheckoutForm
							data={{ checkoutForm: data.checkoutForm }}
							clientSecret={data.clientSecret}
							publishableKey={data.publishableKey}
						/>
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
							{#each cartItems as item}
								<div class="flex gap-3">
									{#if item.image}
										<div class="w-16 h-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
											<img src={item.image} alt={item.name} class="w-full h-full object-contain" />
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<h3 class="font-medium text-sm mb-1 truncate">{item.name}</h3>
										<p class="text-xs text-muted-foreground">
											{formatPrice(item.price, item.currency)}
										</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="border-t pt-4 space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Subtotal</span>
								<span>{formatPrice(total, totalCurrency)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Items</span>
								<span>{cartItems.length}</span>
							</div>
						</div>
						<div class="border-t pt-4">
							<div class="flex justify-between text-lg font-semibold">
								<span>Total</span>
								<span>{formatPrice(total, totalCurrency)}</span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	{/if}
</div>
