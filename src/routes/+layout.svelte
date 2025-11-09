<script lang="ts">
	import '../app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import Navbar from '$lib/components/navbar.svelte';
	import type { LayoutData } from './$types.js';

	injectAnalytics();

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Navbar {data} />
	<main class="flex-1">
		<div class="flex flex-col justify-center items-center mx-auto max-w-5xl sm:px-6 lg:px-8 py-8">
			{@render children()}
		</div>
	</main>
</div>
