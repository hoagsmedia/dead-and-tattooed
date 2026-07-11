<script lang="ts">
	import '../app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import type { LayoutData } from './$types.js';
	import { page } from '$app/state';
	import SiteHeader from './Components/Site-Header.svelte';
	import SiteFooter from './Components/Site-Footer.svelte';
	injectAnalytics();

	let { children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const ogImage = $derived(new URL('/deadandtattooed.png', page.url.origin).href);
</script>

<svelte:head>
	<meta property="og:site_name" content="Dead & Tattooed" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImage} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<SiteHeader />
	<main class="flex-1">
		<div
			class="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
		>
			{@render children()}
		</div>
	</main>
	<SiteFooter />
</div>
