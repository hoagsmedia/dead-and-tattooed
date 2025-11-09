<script lang="ts">
	import type { PageData } from './$types.js';
	import { formatPrice } from '$lib/utils';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ShoppingCart } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-4xl font-bold tracking-tight mb-2">Products</h1>
		<p class="text-muted-foreground">Browse our available products and services</p>
	</div>

	{#if data.products.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<p class="text-muted-foreground">No products available at this time.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.products as product}
				<Card.Root class="flex flex-col pt-0">
					{#if product.images && product.images.length > 0}
						<div class="aspect-video w-full overflow-hidden rounded-t-lg">
							<img src={product.images[0]} alt={product.name} class="w-full h-full object-cover" />
						</div>
					{/if}
					<Card.Header>
						<Card.Title>{product.name}</Card.Title>
						{#if product.description}
							<Card.Description class="line-clamp-3">
								{product.description}
							</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content class="flex-1">
						{#if product.prices.length > 0}
							<div class="space-y-2 mb-4">
								{#each product.prices as price}
									<div class="flex items-center justify-between">
										<div>
											<p class="font-semibold text-lg">
												{formatPrice(price.amount, price.currency)}
											</p>
											{#if price.recurring}
												<p class="text-sm text-muted-foreground">
													per {price.recurring.interval_count === 1
														? price.recurring.interval
														: `${price.recurring.interval_count} ${price.recurring.interval}s`}
												</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Card.Content>
					<Card.Footer>
						<Button class="w-full" variant="default">
							<ShoppingCart class="mr-2 size-4" />
							Add to Cart
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
