<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte.js';
	import { formatPrice } from '$lib/utils.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Trash2, ShoppingBag } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	function handleRemoveItem(productId: string) {
		cart.removeItem(productId);
	}

	function handleClearCart() {
		if (confirm('Are you sure you want to clear your cart?')) {
			cart.clear();
		}
	}

	function getTotalCurrency() {
		if (cart.items.length === 0) return 'USD';
		// Note: Assumes all items have the same currency
		// If multi-currency support is needed, totals should be grouped by currency
		return cart.items[0].currency;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-4xl font-bold tracking-tight mb-2">Shopping Cart</h1>
		<p class="text-muted-foreground">Review your items before checkout</p>
	</div>

	{#if cart.isEmpty}
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
			<!-- Cart Items -->
			<div class="lg:col-span-2 space-y-4">
				{#each cart.items as item}
					<Card.Root>
						<Card.Content class="p-6">
							<div class="flex gap-4">
								{#if item.image}
									<div class="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
										<img
											src={item.image}
											alt={item.name}
											class="w-full h-full object-contain"
										/>
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-lg mb-1">{item.name}</h3>
									<p class="text-muted-foreground mb-4">
										{formatPrice(item.price, item.currency)}
										{#if item.recurring}
											<span class="text-sm">
												/ {item.recurring.interval_count === 1
													? item.recurring.interval
													: `${item.recurring.interval_count} ${item.recurring.interval}s`}
											</span>
										{/if}
									</p>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleRemoveItem(item.productId)}
									>
										<Trash2 class="mr-2 size-4" />
										Remove
									</Button>
								</div>
								<div class="text-right">
									<p class="font-semibold text-lg">
										{formatPrice(item.price, item.currency)}
									</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}

				<div class="flex justify-end">
					<Button variant="outline" onclick={handleClearCart}>
						Clear Cart
					</Button>
				</div>
			</div>

			<!-- Order Summary -->
			<div class="lg:col-span-1">
				<Card.Root class="sticky top-8">
					<Card.Header>
						<Card.Title>Order Summary</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Subtotal</span>
								<span>{formatPrice(cart.total, getTotalCurrency())}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Items</span>
								<span>{cart.itemCount}</span>
							</div>
						</div>
						<div class="border-t pt-4">
							<div class="flex justify-between text-lg font-semibold mb-4">
								<span>Total</span>
								<span>{formatPrice(cart.total, getTotalCurrency())}</span>
							</div>
							<Button class="w-full" size="lg" disabled>
								Checkout
							</Button>
							<p class="text-xs text-muted-foreground text-center mt-2">
								Checkout functionality coming soon
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	{/if}
</div>

