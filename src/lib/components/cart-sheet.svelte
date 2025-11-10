<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte.js';
	import { formatPrice } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Trash2, ShoppingBag } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { onClose }: { onClose?: () => void } = $props();

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

	function handleBrowseProducts() {
		onClose?.();
		goto('/products');
	}
</script>

{#if cart.isEmpty}
	<div class="flex flex-col items-center justify-center py-12 text-center px-4">
		<ShoppingBag class="size-12 mb-4 text-muted-foreground" />
		<p class="text-lg font-medium mb-2">Your cart is empty</p>
		<p class="text-muted-foreground mb-6">Start adding products to your cart</p>
		<Button onclick={handleBrowseProducts}>Browse Products</Button>
	</div>
{:else}
	<div class="flex flex-col flex-1 min-h-0">
		<!-- Cart Items - Scrollable -->
		<div class="flex-1 overflow-y-auto px-4 min-h-0 space-y-4 py-4">
			{#each cart.items as item}
				<div class="flex gap-4 border-b pb-4 last:border-0">
					{#if item.image}
						<div class="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
							<img src={item.image} alt={item.name} class="w-full h-full object-contain" />
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-base mb-1 truncate">{item.name}</h3>
						<p class="text-sm text-muted-foreground mb-2">
							{formatPrice(item.price, item.currency)}
							{#if item.recurring}
								<span class="text-xs">
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
							class="h-8"
						>
							<Trash2 class="mr-2 size-3" />
							Remove
						</Button>
					</div>
					<div class="text-right">
						<p class="font-semibold">{formatPrice(item.price, item.currency)}</p>
					</div>
				</div>
			{/each}
		</div>

		<!-- Order Summary - Fixed at bottom -->
		<div class="border-t pt-4 px-4 space-y-4">
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
				<div class="flex gap-2">
					<Button variant="outline" class="flex-1" onclick={handleClearCart}>Clear Cart</Button>
					<Button class="flex-1" size="lg" disabled>Checkout</Button>
				</div>
				<p class="text-xs text-muted-foreground text-center mt-2">
					Checkout functionality coming soon
				</p>
			</div>
		</div>
	</div>
{/if}
