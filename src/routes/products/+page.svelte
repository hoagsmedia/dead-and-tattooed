<script lang="ts">
	import type { PageData } from './$types.js';
	import { formatPrice } from '$lib/utils';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-4xl font-bold tracking-tight mb-2">Gallery</h1>
		<p class="text-muted-foreground">One-of-a-kind preserved tattoo art pieces</p>
	</div>

	{#if data.artworks.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<p class="text-muted-foreground">No pieces available at this time.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.artworks as piece (piece.id)}
				<a href="/products/{piece.id}" class="block">
					<Card.Root
						class="flex flex-col pt-0 hover:shadow-lg transition-shadow cursor-pointer h-full"
					>
						{#if piece.image}
							<div
								class="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted flex items-center justify-center"
							>
								<img src={piece.image} alt={piece.title} class="w-full h-full object-contain" />
								{#if piece.status === 'sold'}
									<span
										class="absolute top-2 right-2 rounded-md bg-destructive px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white"
									>
										Sold
									</span>
								{/if}
							</div>
						{:else if piece.status === 'sold'}
							<div class="pt-4 px-4">
								<span
									class="inline-block rounded-md bg-destructive px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white"
								>
									Sold
								</span>
							</div>
						{/if}
						<Card.Header>
							<Card.Title>{piece.title}</Card.Title>
							{#if piece.description}
								<Card.Description class="line-clamp-3">
									{piece.description}
								</Card.Description>
							{/if}
						</Card.Header>
						<Card.Content class="flex-1">
							{#if piece.priceCents !== null}
								<p class="font-semibold text-lg">{formatPrice(piece.priceCents, 'usd')}</p>
							{/if}
						</Card.Content>
						<Card.Footer>
							<Button class="w-full" variant="default">View Details</Button>
						</Card.Footer>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>
