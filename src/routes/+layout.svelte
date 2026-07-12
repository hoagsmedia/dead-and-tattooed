<script lang="ts">
	import '../app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import type { LayoutData } from './$types.js';
	import { page } from '$app/state';
	import SiteHeader from './Components/Site-Header.svelte';
	import SiteFooter from './Components/Site-Footer.svelte';
	injectAnalytics();

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const ogImage = $derived(new URL('/deadandtattooed.png', page.url.origin).href);
	// Product detail pages set their own og:image/twitter:card (the piece's
	// cover image); emitting the generic ones too would make scrapers pick
	// the wrong image, since they take the first og:image in the document.
	const isProductDetail = $derived(page.route.id === '/products/[id]');
</script>

<svelte:head>
	<meta property="og:site_name" content="Dead & Tattooed" />
	<meta property="og:type" content="website" />
	{#if !isProductDetail}
		<meta property="og:image" content={ogImage} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col">
	<SiteHeader admin={data.admin} />
	<main class="flex-1">
		<div
			class="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
		>
			{@render children()}
		</div>
	</main>
	<SiteFooter />
</div>
