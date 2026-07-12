<script lang="ts">
	import type { PageData } from './$types.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Unsubscribed — Dead &amp; Tattooed</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-16">
	<Card.Root>
		<Card.Content class="space-y-4 py-10 text-center">
			<h1 class="font-display text-2xl tracking-wide uppercase">
				{data.removed ? "You're off the list" : "You're already off the list"}
			</h1>
			<p class="text-muted-foreground">
				{data.removed
					? 'No more drop emails. If you change your mind, the signup form is always in the footer.'
					: "That link has already done its job — you won't get any more drop emails from us."}
			</p>
			<Button href="/products" variant="outline">Back to the gallery</Button>
		</Card.Content>
	</Card.Root>
</div>
