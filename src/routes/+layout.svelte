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
	<!-- Site-wide defaults. Page-level <svelte:head> tags override these (SvelteKit
	     dedupes meta by name/property and the deeper component wins; the homepage
	     and content pages set their own title/description where it matters). -->
	<title>Dead &amp; Tattooed — one-of-a-kind tattooed specimens in jars</title>
	<meta
		name="description"
		content="Hand-tattooed, preserved specimens sealed in glass jars. Every piece is a one-of-one original from a tattoo artist who takes dead things very seriously. Ships within the US."
	/>
	<meta property="og:site_name" content="Dead & Tattooed" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Dead & Tattooed — one-of-a-kind tattooed specimens" />
	<meta
		property="og:description"
		content="Hand-tattooed, preserved specimens sealed in glass. Every piece is a one-of-one — when it's gone, it's gone."
	/>
	{#if !isProductDetail}
		<meta property="og:image" content={ogImage} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="Dead & Tattooed — one-of-a-kind tattooed specimens" />
		<meta
			name="twitter:description"
			content="Hand-tattooed, preserved specimens sealed in glass. Every piece is a one-of-one — when it's gone, it's gone."
		/>
		<meta name="twitter:image" content={ogImage} />
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
