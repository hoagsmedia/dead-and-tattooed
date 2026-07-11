<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { CheckCircle } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { formatPrice } from '$lib/utils.js';
	import { cart } from '$lib/stores/cart.svelte.js';

	let { data }: { data: PageData } = $props();

	onMount(() => {
		// The pieces are theirs now — clear the cart and the checkout session
		cart.clear();
		sessionStorage.removeItem('dnt-checkout-session');
	});
</script>

<div class="container mx-auto px-4 py-16">
	<Card.Root class="max-w-3xl mx-auto">
		<Card.Content class="py-12">
			<div class="text-center mb-8">
				<CheckCircle class="size-16 mx-auto mb-6 text-green-600" />
				<h1 class="text-3xl font-bold mb-4">It's yours!</h1>
				<p class="text-muted-foreground">
					Thank you for giving this one-of-a-kind piece a home. Real ink. Real preservation. Real
					weird.
				</p>
			</div>

			{#if data.titles.length > 0}
				<div class="border-t pt-6 mb-6">
					<h2 class="text-xl font-semibold mb-4">
						{data.titles.length === 1 ? 'Your piece' : 'Your pieces'}
					</h2>
					<ul class="space-y-2">
						{#each data.titles as title (title)}
							<li class="font-medium">{title}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="border-t pt-6 mb-6">
				<div class="flex justify-between items-center">
					<span class="text-lg font-semibold">Total</span>
					<span class="text-xl font-bold">{formatPrice(data.totalCents, data.currency)}</span>
				</div>
			</div>

			<p class="text-sm text-muted-foreground text-center mb-8">
				You'll get an email receipt{data.customerEmail ? ` at ${data.customerEmail}` : ''} shortly, and
				we'll be in touch when your piece ships.
			</p>

			<div class="flex gap-4 justify-center">
				<Button onclick={() => goto('/products')}>Back to the Gallery</Button>
				<Button variant="outline" onclick={() => goto('/')}>Return Home</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
