<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import ArtworkForm from './artwork-form.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showForm = $state(false);
	let editingArtwork = $state<typeof data.artworks[0] | null>(null);

	function openCreateForm() {
		editingArtwork = null;
		showForm = true;
	}

	function openEditForm(artwork: typeof data.artworks[0]) {
		editingArtwork = artwork;
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingArtwork = null;
		goto('/dashboard', { invalidateAll: true });
	}

	async function handleDelete(result: any) {
		if (result.type === 'success') {
			goto('/dashboard', { invalidateAll: true });
		}
	}

	// Handle form close after successful submission
	function handleFormSuccess() {
		closeForm();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Dashboard</h1>
			<p class="text-gray-600 mt-1">Manage your artwork</p>
		</div>
		<Button onclick={openCreateForm}>Add New Artwork</Button>
	</div>

	{#if showForm}
		<ArtworkForm
			action={editingArtwork ? '?/update' : '?/create'}
			artwork={editingArtwork || undefined}
			onclose={handleFormSuccess}
		/>
	{:else}
		{#if data.artworks.length === 0}
			<Card.Root>
				<Card.Content class="pt-6">
					<p class="text-center text-gray-500">No artwork yet. Click "Add New Artwork" to get started.</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each data.artworks as artwork (artwork.id)}
					<Card.Root>
						{#if artwork.images && artwork.images.length > 0}
							<img src={artwork.images[0]} alt={artwork.title} class="w-full h-48 object-cover" />
						{/if}
						<Card.Header>
							<Card.Title>{artwork.title}</Card.Title>
							<Card.Description>
								{#if artwork.price}
									${artwork.price}
								{:else}
									Not for sale
								{/if}
								<br />
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs {artwork.published
									? 'bg-green-100 text-green-800'
									: 'bg-gray-100 text-gray-800'}">
									{artwork.published ? 'Published' : 'Draft'}
								</span>
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="flex space-x-2">
								<Button variant="outline" size="sm" onclick={() => openEditForm(artwork)}>
									Edit
								</Button>
								<form method="POST" action="?/delete" use:enhance={handleDelete}>
									<input type="hidden" name="id" value={artwork.id} />
									<Button type="submit" variant="destructive" size="sm">Delete</Button>
								</form>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	{/if}
</div>

