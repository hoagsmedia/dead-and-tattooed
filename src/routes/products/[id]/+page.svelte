<script lang="ts">
	import type { PageData } from './$types.js';
	import { formatPrice } from '$lib/utils.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ShoppingCart, ArrowLeft, Check } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cart } from '$lib/stores/cart.svelte.js';
	import { productJsonLd, trimDescription } from '$lib/seo.js';
	import NotifyForm from '../../Components/Notify-Form.svelte';

	let { data }: { data: PageData } = $props();

	let selectedImage = $state(0);

	// SEO / social
	const pageTitle = $derived(`${data.artwork.title} — Dead & Tattooed`);
	const metaDescription = $derived(
		trimDescription(data.artwork.description) ||
			'A one-of-a-kind hand-tattooed, preserved specimen from Dead & Tattooed.'
	);
	const coverImage = $derived(data.artwork.images[0] ?? null);
	// '<' is escaped as \u003c inside productJsonLd, so {@html} is safe here.
	const jsonLdTag = $derived(
		`<script type="application/ld+json">${productJsonLd(data.artwork, page.url.href)}<` + '/script>'
	);

	// Reset the gallery when navigating between pieces
	$effect(() => {
		void data.artwork.id;
		selectedImage = 0;
	});

	const inCart = $derived(cart.items.some((item) => item.artworkId === data.artwork.id));

	function handleAddToCart() {
		cart.addItem({
			artworkId: data.artwork.id,
			title: data.artwork.title,
			image: data.artwork.images[0] ?? null,
			priceCents: data.artwork.priceCents ?? 0
		});
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={metaDescription} />
	{#if coverImage}
		<meta property="og:image" content={coverImage} />
	{/if}
	<meta property="og:url" content={page.url.href} />
	<meta name="twitter:card" content="summary_large_image" />
	{@html jsonLdTag}
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<Button variant="ghost" class="mb-6" onclick={() => goto('/products')}>
		<ArrowLeft class="mr-2 size-4" />
		Back to Gallery
	</Button>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Image Gallery -->
		<div class="space-y-4">
			{#if data.artwork.images.length > 0}
				<div
					class="aspect-square w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center"
				>
					<img
						src={data.artwork.images[selectedImage]}
						alt={data.artwork.title}
						class="w-full h-full object-contain"
					/>
				</div>
				{#if data.artwork.images.length > 1}
					<div class="grid grid-cols-4 gap-4">
						{#each data.artwork.images as image, index (image)}
							<button
								type="button"
								class="aspect-square overflow-hidden rounded-lg border bg-muted flex items-center justify-center {index ===
								selectedImage
									? 'ring-2 ring-primary'
									: ''}"
								onclick={() => (selectedImage = index)}
								aria-label={`Show image ${index + 1} of ${data.artwork.title}`}
							>
								<img
									src={image}
									alt={`${data.artwork.title} - Image ${index + 1}`}
									class="w-full h-full object-contain cursor-pointer hover:opacity-75 transition-opacity"
								/>
							</button>
						{/each}
					</div>
				{/if}
			{:else}
				<div
					class="aspect-square w-full flex items-center justify-center bg-muted rounded-lg border"
				>
					<p class="text-muted-foreground">No image available</p>
				</div>
			{/if}
		</div>

		<!-- Piece Details -->
		<div class="space-y-6">
			<div>
				<h1 class="text-4xl font-bold tracking-tight mb-4">{data.artwork.title}</h1>
				{#if data.artwork.description}
					<div class="prose prose-lg max-w-none">
						<p class="text-muted-foreground whitespace-pre-line">{data.artwork.description}</p>
					</div>
				{/if}
			</div>

			{#if data.artwork.status === 'sold'}
				<Card.Root>
					<Card.Content class="space-y-6 py-8 text-center">
						<div>
							<p class="text-lg font-medium">Sold</p>
							<p class="text-muted-foreground mt-1">
								This one-of-a-kind piece has found its collector.
							</p>
						</div>
						<div class="mx-auto flex max-w-sm flex-col items-center text-left">
							<NotifyForm heading="This one's gone. Get first look at the next drop." />
						</div>
					</Card.Content>
				</Card.Root>
			{:else if data.artwork.status === 'reserved'}
				<Card.Root>
					<Card.Content class="py-8 text-center">
						<p class="text-lg font-medium">Reserved — check back soon</p>
						<p class="text-muted-foreground mt-1">
							Someone has this piece in checkout right now. If they don't complete the purchase, it
							will be available again shortly.
						</p>
					</Card.Content>
				</Card.Root>
			{:else if data.artwork.priceCents !== null}
				<Card.Root>
					<Card.Content>
						<div class="flex items-center justify-between p-4 border rounded-lg">
							<div>
								<p class="font-semibold text-2xl">
									{formatPrice(data.artwork.priceCents, 'usd')}
								</p>
								<p class="text-sm text-muted-foreground">One of a kind</p>
							</div>
							{#if inCart}
								<Button variant="outline" size="lg" disabled>
									<Check class="mr-2 size-4" />
									In Cart
								</Button>
							{:else}
								<Button variant="default" size="lg" onclick={handleAddToCart}>
									<ShoppingCart class="mr-2 size-4" />
									Add to Cart
								</Button>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Content class="py-8 text-center">
						<p class="text-muted-foreground">No pricing available for this piece.</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
</div>
