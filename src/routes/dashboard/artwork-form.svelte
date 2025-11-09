<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { artworkSchema } from './schema';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let {
		action,
		artwork: initialArtwork,
		onclose
	}: {
		action: string;
		artwork?: {
			id: string;
			title: string;
			price: string | null;
			images: string[];
			published: boolean;
		};
		onclose?: () => void;
	} = $props();

	const form = superForm(
		{
			title: initialArtwork?.title || '',
			price: initialArtwork?.price || '',
			images: initialArtwork?.images || [],
			published: initialArtwork?.published || false
		},
		{
			validators: zod4Client(artworkSchema),
			onUpdated: ({ form: f }) => {
				// If form is valid after update, the submission was successful
				if (f.valid) {
					if (onclose) {
						onclose();
					} else {
						goto('/dashboard', { invalidateAll: true });
					}
				}
			}
		}
	);

	const { form: formData, enhance: formEnhance } = form;

	let imageFiles = $state<File[]>([]);
	let uploading = $state(false);
	let uploadedUrls = $state<string[]>(initialArtwork?.images || []);

	async function handleImageUpload() {
		if (imageFiles.length === 0) return;

		uploading = true;
		const newUrls: string[] = [];

		for (const file of imageFiles) {
			const formData = new FormData();
			formData.append('file', file);

			try {
				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					throw new Error('Upload failed');
				}

				const data = await response.json();
				newUrls.push(data.url);
			} catch (error) {
				console.error('Upload error:', error);
				alert('Failed to upload image');
			}
		}

		uploadedUrls = [...uploadedUrls, ...newUrls];
		$formData.images = uploadedUrls;
		imageFiles = [];
		uploading = false;
	}

	function removeImage(index: number) {
		uploadedUrls = uploadedUrls.filter((_, i) => i !== index);
		$formData.images = uploadedUrls;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{initialArtwork ? 'Edit Artwork' : 'Add New Artwork'}</Card.Title>
		<Card.Description>
			{initialArtwork ? 'Update your artwork details' : 'Create a new artwork listing'}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" {action} use:formEnhance class="space-y-6">
			{#if initialArtwork}
				<input type="hidden" name="id" value={initialArtwork.id} />
			{/if}

			<Form.Field form={$formData} name="title">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Title</Form.Label>
						<Input {...props} type="text" bind:value={$formData.title} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={$formData} name="price">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Price</Form.Label>
						<Input {...props} type="number" step="0.01" bind:value={$formData.price} />
					{/snippet}
				</Form.Control>
				<Form.Description>Leave empty if not for sale</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium mb-2">Images</label>
				<input
					type="file"
					accept="image/*"
					multiple
					onchange={(e) => {
						const files = e.currentTarget.files;
						imageFiles = files ? Array.from(files) : [];
					}}
					class="mb-2"
					disabled={uploading}
				/>
				<Button
					type="button"
					onclick={handleImageUpload}
					disabled={uploading || imageFiles.length === 0}
				>
					{uploading ? 'Uploading...' : 'Upload Images'}
				</Button>

				{#if uploadedUrls.length > 0}
					<div class="mt-4 grid grid-cols-2 gap-4">
						{#each uploadedUrls as url, index}
							<div class="relative">
								<img
									src={url}
									alt={initialArtwork
										? `${initialArtwork.title} - Image ${index + 1}`
										: `Artwork preview ${index + 1}`}
									class="w-full h-48 object-cover rounded"
								/>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									class="absolute top-2 right-2"
									onclick={() => removeImage(index)}
								>
									Remove
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<Form.Field form={$formData} name="published">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center space-x-2">
							<Checkbox {...props} bind:checked={$formData.published} id="published" />
							<Form.Label for="published" class="!mt-0 cursor-pointer">Publish publicly</Form.Label>
						</div>
					{/snippet}
				</Form.Control>
			</Form.Field>

			<input type="hidden" name="images" value={JSON.stringify(uploadedUrls)} />

			<div class="flex space-x-2">
				<Form.Button type="submit">{initialArtwork ? 'Update' : 'Create'}</Form.Button>
				<Button type="button" variant="outline" onclick={() => onclose?.() || goto('/dashboard')}>
					Cancel
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
