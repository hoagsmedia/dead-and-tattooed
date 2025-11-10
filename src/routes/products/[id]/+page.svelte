<script lang="ts">
	import type { PageData } from './$types.js';
	import { formatPrice } from '$lib/utils.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ShoppingCart, ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<Button
		variant="ghost"
		class="mb-6"
		onclick={() => goto('/products')}
	>
		<ArrowLeft class="mr-2 size-4" />
		Back to Products
	</Button>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Product Images -->
		<div class="space-y-4">
			{#if data.product.images && data.product.images.length > 0}
				<div class="aspect-square w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
					<img
						src={data.product.images[0]}
						alt={data.product.name}
						class="w-full h-full object-contain"
					/>
				</div>
				{#if data.product.images.length > 1}
					<div class="grid grid-cols-4 gap-4">
						{#each data.product.images.slice(1, 5) as image, index}
							<div class="aspect-square overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
								<img
									src={image}
									alt={`${data.product.name} - Image ${index + 2}`}
									class="w-full h-full object-contain cursor-pointer hover:opacity-75 transition-opacity"
								/>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="aspect-square w-full flex items-center justify-center bg-muted rounded-lg border">
					<p class="text-muted-foreground">No image available</p>
				</div>
			{/if}
		</div>

		<!-- Product Details -->
		<div class="space-y-6">
			<div>
				<h1 class="text-4xl font-bold tracking-tight mb-4">{data.product.name}</h1>
				{#if data.product.description}
					<div class="prose prose-lg max-w-none">
						<p class="text-muted-foreground whitespace-pre-line">{data.product.description}</p>
					</div>
				{/if}
			</div>

			<!-- Pricing -->
			{#if data.product.prices.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Pricing</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						{#each data.product.prices as price}
							<div class="flex items-center justify-between p-4 border rounded-lg">
								<div>
									<p class="font-semibold text-2xl">
										{formatPrice(price.amount, price.currency)}
									</p>
									{#if price.recurring}
										<p class="text-sm text-muted-foreground">
											per {price.recurring.interval_count === 1
												? price.recurring.interval
												: `${price.recurring.interval_count} ${price.recurring.interval}s`}
										</p>
									{:else}
										<p class="text-sm text-muted-foreground">One-time payment</p>
									{/if}
								</div>
								<Button variant="default" size="lg">
									<ShoppingCart class="mr-2 size-4" />
									Add to Cart
								</Button>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Content class="py-8 text-center">
						<p class="text-muted-foreground">No pricing available for this product.</p>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Metadata -->
			{#if data.product.metadata && Object.keys(data.product.metadata).length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Additional Information</Card.Title>
					</Card.Header>
					<Card.Content>
						<dl class="space-y-2">
							{#each Object.entries(data.product.metadata) as [key, value]}
								<div class="flex justify-between">
									<dt class="font-medium capitalize">{key.replace(/_/g, ' ')}:</dt>
									<dd class="text-muted-foreground">{value}</dd>
								</div>
							{/each}
						</dl>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
</div>

