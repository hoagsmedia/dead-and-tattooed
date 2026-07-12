<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { enhance } from '$app/forms';
	import { Truck, ImageOff } from '@lucide/svelte';
	import StatusBadge from '$lib/components/status-badge.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state<string | null>(null);

	// Failed markShipped submissions: message + which order's form it belongs to.
	const failError = $derived(form?.error ?? null);
	const failedOrderId = $derived(form?.error ? (form.orderId ?? null) : null);

	const fmtDate = (d: Date | string) =>
		new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

	function formatPrice(price: string | null): string {
		if (!price) return '—';
		const n = Number(price);
		return Number.isNaN(n) ? `$${price}` : `$${n.toFixed(2)}`;
	}
</script>

<svelte:head>
	<title>Orders — Dead &amp; Tattooed</title>
	<meta name="description" content="Every order: who bought what, where it ships, what moved." />
</svelte:head>

<div class="w-full space-y-6">
	<div>
		<h1 class="font-display text-3xl tracking-wide uppercase">Orders</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Who bought what, where it ships, and what's already out the door.
		</p>
	</div>

	{#if data.orders.length === 0}
		<Card.Root>
			<Card.Content class="py-10 text-center text-muted-foreground">
				<p>No orders yet. They'll show up here the moment a piece sells.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each data.orders as o (o.id)}
				<Card.Root data-testid="admin-order-card">
					<Card.Header class="flex-row items-start justify-between space-y-0">
						<div>
							<Card.Title class="text-base">{fmtDate(o.createdAt)}</Card.Title>
							<Card.Description>
								Order {o.id.slice(0, 8)} · {o.buyerName} &lt;{o.buyerEmail}&gt;
							</Card.Description>
						</div>
						<div class="flex items-center gap-3">
							<StatusBadge status={o.status} />
							<span class="font-semibold">{formatPrice(o.total)}</span>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-3">
							{#each o.items as item, i (i)}
								<div class="flex items-center gap-3">
									{#if item.image}
										<img
											src={item.image}
											alt={item.name}
											class="h-14 w-14 rounded-md object-cover"
										/>
									{:else}
										<div
											class="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground"
										>
											<ImageOff class="size-5" />
										</div>
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
										<p class="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
									</div>
								</div>
							{/each}
						</div>

						<div class="text-sm">
							<p class="font-medium">Ships to</p>
							{#if o.addressLines.length}
								{#each o.addressLines as line, i (i)}
									<p class="text-muted-foreground">{line}</p>
								{/each}
							{:else}
								<p class="text-muted-foreground">No address on file.</p>
							{/if}
						</div>

						{#if o.status === 'shipped'}
							<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
								<Truck class="size-4 text-primary" />
								<span>
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
										{o.trackingNumber}
									{/if}
								</span>
							</div>
						{:else if o.status !== 'cancelled'}
							<form
								method="POST"
								action="?/markShipped"
								class="flex flex-wrap items-end gap-2 border-t border-border/70 pt-4"
								use:enhance={() => {
									submitting = o.id;
									return async ({ update }) => {
										submitting = null;
										await update();
									};
								}}
							>
								<input type="hidden" name="orderId" value={o.id} />
								<div class="w-32 space-y-1">
									<label for={`carrier-${o.id}`} class="text-xs text-muted-foreground">
										Carrier
									</label>
									<Input id={`carrier-${o.id}`} name="carrier" placeholder="USPS" />
								</div>
								<div class="w-56 space-y-1">
									<label for={`tracking-${o.id}`} class="text-xs text-muted-foreground">
										Tracking number
									</label>
									<Input
										id={`tracking-${o.id}`}
										name="trackingNumber"
										placeholder="9400 1118 9922 …"
										required
									/>
								</div>
								<Button type="submit" size="sm" disabled={submitting === o.id}>
									<Truck class="size-4" />
									{submitting === o.id ? 'Marking…' : 'Mark shipped'}
								</Button>
								{#if failError && failedOrderId === o.id}
									<p class="w-full text-sm text-destructive">{failError}</p>
								{/if}
							</form>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
