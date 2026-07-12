<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import ArtworkForm from './artwork-form.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Plus, Pencil, Trash2, ImageOff } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

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

	const badgeClass: Record<string, string> = {
		available: 'border-acid-green/50 bg-acid-green/10 text-acid-green',
		reserved: 'border-neon-purple/60 bg-neon-purple/15 text-neon-lavender',
		sold: 'border-ink-yellow bg-ink-yellow text-background',
		draft: 'border-border bg-muted text-muted-foreground'
	};

	const badgeLabel: Record<string, string> = {
		available: 'Available',
		reserved: 'Reserved',
		sold: 'Sold',
		draft: 'Draft'
	};

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
							<span
								class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide {badgeClass[
									artwork.availability
								] ?? badgeClass.draft}"
							>
								{badgeLabel[artwork.availability] ?? artwork.availability}
							</span>
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
