<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import ArtworkForm from './artwork-form.svelte';
	import StatusBadge from '$lib/components/status-badge.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Plus, Pencil, Trash2, ImageOff, Megaphone } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showForm = $state(false);
	let editingArtwork = $state<(typeof data.artworks)[0] | null>(null);

	function openCreateForm() {
		editingArtwork = null;
		showForm = true;
	}

	function openEditForm(artwork: (typeof data.artworks)[0]) {
		editingArtwork = artwork;
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingArtwork = null;
		goto('/dashboard', { invalidateAll: true });
	}

	function formatPrice(price: string | null): string {
		if (!price) return '—';
		const n = Number(price);
		return Number.isNaN(n) ? `$${price}` : `$${n.toFixed(2)}`;
	}
</script>

<svelte:head>
	<title>Dashboard — Dead &amp; Tattooed</title>
	<meta name="description" content="Manage your pieces: add, edit, and publish specimens." />
</svelte:head>

<div class="w-full space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="font-display text-3xl tracking-wide uppercase">Your pieces</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Add a piece, give it photos and a story, then flip it live in the gallery.
			</p>
		</div>
		<div class="flex items-center gap-4">
			<a
				href="/dashboard/orders"
				class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				Orders
			</a>
			{#if !showForm}
				<Button onclick={openCreateForm}>
					<Plus class="size-4" />
					Add a piece
				</Button>
			{/if}
		</div>
	</div>

	{#if form?.announced}
		<div
			class="rounded-lg border border-acid-green/50 bg-acid-green/10 px-4 py-3 text-sm text-acid-green"
			role="status"
		>
			Announced “{form.announcedTitle}” — {form.sent} of {form.total} email{form.total === 1
				? ''
				: 's'} sent.
		</div>
	{:else if form?.error}
		<div
			class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			role="alert"
		>
			{form.error}
		</div>
	{/if}

	{#if showForm}
		<ArtworkForm
			action={editingArtwork ? '?/update' : '?/create'}
			artwork={editingArtwork || undefined}
			onclose={closeForm}
		/>
	{:else if data.artworks.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<img src="/jar.svg" alt="" class="h-20 w-auto opacity-60" aria-hidden="true" />
				<p class="font-medium">The shelf is empty.</p>
				<p class="max-w-sm text-sm text-muted-foreground">
					Your first specimen is one click away: photos, a title, a price, and the story behind the
					ink.
				</p>
				<Button onclick={openCreateForm} class="mt-2">
					<Plus class="size-4" />
					Add your first piece
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<ul class="space-y-3">
			{#each data.artworks as artwork (artwork.id)}
				<li
					class="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center"
				>
					{#if artwork.images && artwork.images.length > 0}
						<img
							src={artwork.images[0]}
							alt={artwork.title}
							class="h-20 w-20 shrink-0 rounded-lg border border-border object-cover"
						/>
					{:else}
						<div
							class="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"
						>
							<ImageOff class="size-6" />
						</div>
					{/if}

					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="truncate font-semibold">{artwork.title}</h2>
							<StatusBadge status={artwork.availability} />
							{#if artwork.published && artwork.availability !== 'sold'}
								<span class="text-xs text-muted-foreground">Live in gallery</span>
							{/if}
						</div>
						<p class="text-sm text-muted-foreground">
							{artwork.price ? formatPrice(artwork.price) : 'Not for sale'}
							{#if artwork.images?.length}
								&middot; {artwork.images.length} photo{artwork.images.length === 1 ? '' : 's'}
							{/if}
						</p>
						{#if artwork.description}
							<p class="line-clamp-1 text-sm text-muted-foreground/80">{artwork.description}</p>
						{/if}
					</div>

					<div class="flex shrink-0 gap-2">
						{#if artwork.availability === 'available'}
							<form
								method="POST"
								action="?/announce"
								use:enhance
								onsubmit={(e) => {
									if (
										!confirm(
											`Email ${data.subscriberCount} subscriber${data.subscriberCount === 1 ? '' : 's'} about "${artwork.title}"?`
										)
									) {
										e.preventDefault();
									}
								}}
							>
								<input type="hidden" name="id" value={artwork.id} />
								<Button
									type="submit"
									variant="outline"
									size="sm"
									disabled={data.subscriberCount === 0}
									title={data.subscriberCount === 0 ? 'No subscribers yet' : undefined}
								>
									<Megaphone class="size-3.5" />
									Announce to list ({data.subscriberCount} subscriber{data.subscriberCount === 1
										? ''
										: 's'})
								</Button>
							</form>
						{/if}
						<Button variant="outline" size="sm" onclick={() => openEditForm(artwork)}>
							<Pencil class="size-3.5" />
							Edit
						</Button>
						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') {
										await update({ invalidateAll: true });
									}
								};
							}}
							onsubmit={(e) => {
								if (!confirm(`Delete "${artwork.title}"? This can't be undone.`)) {
									e.preventDefault();
								}
							}}
						>
							<input type="hidden" name="id" value={artwork.id} />
							<Button type="submit" variant="destructive" size="sm">
								<Trash2 class="size-3.5" />
								Delete
							</Button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
