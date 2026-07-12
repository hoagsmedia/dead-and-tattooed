<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import StatusBadge from '$lib/components/status-badge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const session = authClient.useSession();
	let resent = $state(false);
	let busy = $state(false);

	async function resendVerification() {
		if (busy) return;
		busy = true;
		const email = $session.data?.user.email;
		if (email) {
			await authClient.sendVerificationEmail({ email, callbackURL: '/account' });
			resent = true;
		}
		busy = false;
	}

	const fmtDate = (d: Date | string) =>
		new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
</script>

<svelte:head>
	<title>Your orders · Dead & Tattooed</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl p-4 py-10">
	<h1 class="mb-6 text-3xl font-bold">Your orders</h1>

	{#if !data.verified}
		<Card.Root>
			<Card.Header>
				<Card.Title>Verify your email first</Card.Title>
				<Card.Description>
					Order history is matched to your email address, so we need to know it's really yours.
					Check your inbox for the verification link.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if resent}
					<p class="text-sm" data-testid="verify-resent">
						Verification email sent — check your inbox.
					</p>
				{:else}
					<Button onclick={resendVerification} disabled={busy}>
						{busy ? 'Sending…' : 'Resend verification email'}
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if data.orders.length === 0}
		<Card.Root>
			<Card.Content class="py-10 text-center text-muted-foreground">
				<p>No orders yet under this email.</p>
				<p class="mt-2 text-sm">
					Bought a piece before making an account? Orders match the email you used at checkout.
				</p>
				<Button href="/products" variant="outline" class="mt-6">Browse the gallery</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each data.orders as o (o.id)}
				<Card.Root data-testid="order-card">
					<Card.Header class="flex-row items-center justify-between space-y-0">
						<div>
							<Card.Title class="text-base">{fmtDate(o.createdAt)}</Card.Title>
							<Card.Description>Order {o.id.slice(0, 8)}</Card.Description>
						</div>
						<div class="flex items-center gap-3">
							<StatusBadge status={o.status} />
							<span class="font-semibold">${o.total}</span>
						</div>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if o.status === 'shipped' && o.trackingNumber}
							<p class="text-sm text-muted-foreground" data-testid="order-shipped-line">
								Shipped{o.shippedAt ? ` ${fmtDate(o.shippedAt)}` : ''}{o.carrier
									? ` via ${o.carrier}`
									: ''}
								—
								{#if o.trackingUrl}
									<a
										href={o.trackingUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary underline-offset-4 hover:underline"
									>
										{o.trackingNumber}
									</a>
								{:else}
									tracking {o.trackingNumber}
								{/if}
							</p>
						{/if}
						{#each o.items as item, i (i)}
							<div class="flex items-center gap-3">
								{#if item.image}
									<img src={item.image} alt={item.name} class="h-14 w-14 rounded-md object-cover" />
								{:else}
									<div class="h-14 w-14 rounded-md bg-muted"></div>
								{/if}
								<div class="min-w-0">
									{#if item.artworkId}
										<a
											href={`/products/${item.artworkId}`}
											class="truncate font-medium underline-offset-4 hover:underline"
										>
											{item.name}
										</a>
									{:else}
										<span class="truncate font-medium">{item.name}</span>
									{/if}
									<p class="text-sm text-muted-foreground">${item.price}</p>
								</div>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
