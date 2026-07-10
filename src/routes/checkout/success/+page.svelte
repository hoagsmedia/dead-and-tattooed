<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { CheckCircle, ShoppingBag } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { formatPrice } from '$lib/utils.js';

	let { data }: { data: PageData } = $props();

	const order = data.order;
	const orderItems = (order.items || []) as Array<{
		id: string;
		productId: string;
		priceId: string;
		name: string;
		price: string;
		currency: string;
	}>;
</script>

<div class="container mx-auto px-4 py-16">
	<Card.Root class="max-w-3xl mx-auto">
		<Card.Content class="py-12">
			<div class="text-center mb-8">
				<CheckCircle class="size-16 mx-auto mb-6 text-green-600" />
				<h1 class="text-3xl font-bold mb-4">Order Confirmed!</h1>
				<p class="text-muted-foreground mb-2">
					Thank you for your purchase. Your order has been successfully processed.
				</p>
				<p class="text-sm font-medium">
					Order #: <span class="font-mono">{order.id}</span>
				</p>
			</div>

			{#if orderItems.length > 0}
				<div class="border-t pt-6 mb-6">
					<h2 class="text-xl font-semibold mb-4">Order Items</h2>
					<div class="space-y-4">
						{#each orderItems as item (item.id)}
							<div class="flex justify-between items-start pb-4 border-b last:border-0">
								<div class="flex-1">
									<h3 class="font-medium">{item.name}</h3>
									<p class="text-sm text-muted-foreground">
										Product ID: <span class="font-mono">{item.productId}</span>
									</p>
								</div>
								<div class="text-right ml-4">
									<p class="font-semibold">
										{formatPrice(parseFloat(item.price) * 100, item.currency)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div>
					<h3 class="font-semibold mb-2">Shipping Address</h3>
					<div class="text-sm text-muted-foreground">
						<p>{order.shippingAddress.street}</p>
						<p>
							{order.shippingAddress.city}, {order.shippingAddress.state}
							{order.shippingAddress.zip}
						</p>
						<p>{order.shippingAddress.country}</p>
					</div>
				</div>
				<div>
					<h3 class="font-semibold mb-2">Billing Address</h3>
					<div class="text-sm text-muted-foreground">
						<p>{order.billingAddress.street}</p>
						<p>
							{order.billingAddress.city}, {order.billingAddress.state}
							{order.billingAddress.zip}
						</p>
						<p>{order.billingAddress.country}</p>
					</div>
				</div>
			</div>

			<div class="border-t pt-6 mb-6">
				<div class="flex justify-between items-center">
					<span class="text-lg font-semibold">Total</span>
					<span class="text-xl font-bold"
						>{formatPrice(parseFloat(order.total) * 100, order.currency)}</span
					>
				</div>
			</div>

			<p class="text-sm text-muted-foreground text-center mb-8">
				You will receive a confirmation email shortly with your order details.
			</p>

			<div class="flex gap-4 justify-center">
				<Button onclick={() => goto('/products')}>Continue Shopping</Button>
				<Button variant="outline" onclick={() => goto('/')}>Return Home</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
