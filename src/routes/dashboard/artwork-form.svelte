<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { artworkSchema } from './schema';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, X, Loader2, CircleCheck, CircleAlert } from '@lucide/svelte';

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
			description?: string;
			images: string[];
			published: boolean;
		};
		onclose?: () => void;
	} = $props();

	const form = superForm(
		{
			title: initialArtwork?.title || '',
			price: initialArtwork?.price || '',
			description: initialArtwork?.description || '',
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

	type UploadState = 'pending' | 'uploading' | 'done' | 'error';

	let imageFiles = $state<File[]>([]);
	let uploading = $state(false);
	let uploadStates = $state<{ name: string; state: UploadState }[]>([]);
	let uploadError = $state('');
	let uploadedUrls = $state<string[]>(initialArtwork?.images || []);
	let fileInput = $state<HTMLInputElement | null>(null);

	async function handleImageUpload() {
		if (imageFiles.length === 0) return;

		uploading = true;
		uploadError = '';
		uploadStates = imageFiles.map((f) => ({ name: f.name, state: 'pending' as UploadState }));
		const newUrls: string[] = [];

		for (const [i, file] of imageFiles.entries()) {
			uploadStates[i].state = 'uploading';

			const body = new FormData();
			body.append('file', file);

			try {
				const response = await fetch('/api/upload', { method: 'POST', body });

				if (!response.ok) {
					throw new Error('Upload failed');
				}

				const data = await response.json();
				newUrls.push(data.url);
				uploadStates[i].state = 'done';
			} catch (error) {
				console.error('Upload error:', error);
				uploadStates[i].state = 'error';
				uploadError = 'Some images failed to upload. Try those again.';
			}
		}

		uploadedUrls = [...uploadedUrls, ...newUrls];
		$formData.images = uploadedUrls;
		// Keep only the files that failed so the seller can retry them
		imageFiles = imageFiles.filter((_, i) => uploadStates[i].state === 'error');
		if (imageFiles.length === 0 && fileInput) {
			fileInput.value = '';
			uploadStates = [];
		}
		uploading = false;
	}

	function removeImage(index: number) {
		uploadedUrls = uploadedUrls.filter((_, i) => i !== index);
		$formData.images = uploadedUrls;
	}

	function moveImage(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= uploadedUrls.length) return;
		const next = [...uploadedUrls];
		[next[index], next[target]] = [next[target], next[index]];
		uploadedUrls = next;
		$formData.images = uploadedUrls;
	}

	const uploadProgress = $derived(
		uploadStates.filter((s) => s.state === 'done' || s.state === 'error').length
	);
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title class="font-display text-xl tracking-wide uppercase">
			{initialArtwork ? 'Edit piece' : 'Add a piece'}
		</Card.Title>
		<Card.Description>
			{initialArtwork
				? 'Update the details, photos, or visibility of this piece.'
				: 'Photos, a title, a price, and the story. Publish when it’s ready for the gallery.'}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" {action} use:formEnhance class="space-y-6">
			{#if initialArtwork}
				<input type="hidden" name="id" value={initialArtwork.id} />
			{/if}

			<Form.Field {form} name="title">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Title</Form.Label>
						<Input
							{...props}
							type="text"
							placeholder="e.g. Lucky No. 7 — traditional swallow"
							bind:value={$formData.title}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="price">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Price (USD)</Form.Label>
						<Input {...props} type="number" step="0.01" min="0" bind:value={$formData.price} />
					{/snippet}
				</Form.Control>
				<Form.Description>Leave empty if this piece isn't for sale.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Description</Form.Label>
						<Textarea
							{...props}
							rows={5}
							placeholder="The design, the process, anything a collector should know. This shows on the piece's page."
							bind:value={$formData.description}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>Tell the story — buyers read this before they commit.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<div class="space-y-3">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium">Photos</label>
				<div class="flex flex-wrap items-center gap-2">
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						multiple
						onchange={(e) => {
							const files = e.currentTarget.files;
							imageFiles = files ? Array.from(files) : [];
							uploadStates = [];
							uploadError = '';
						}}
						class="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground hover:file:bg-accent/80"
						disabled={uploading}
					/>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={handleImageUpload}
						disabled={uploading || imageFiles.length === 0}
					>
						{#if uploading}
							<Loader2 class="size-4 animate-spin" />
							Uploading {Math.min(uploadProgress + 1, uploadStates.length)} of {uploadStates.length}…
						{:else}
							Upload {imageFiles.length > 0
								? `${imageFiles.length} `
								: ''}photo{imageFiles.length === 1 ? '' : 's'}
						{/if}
					</Button>
				</div>

				{#if uploadStates.length > 0}
					<ul class="space-y-1 text-sm">
						{#each uploadStates as fileState, i (i)}
							<li class="flex items-center gap-2 text-muted-foreground">
								{#if fileState.state === 'uploading'}
									<Loader2 class="size-3.5 animate-spin text-neon-teal" />
								{:else if fileState.state === 'done'}
									<CircleCheck class="size-3.5 text-acid-green" />
								{:else if fileState.state === 'error'}
									<CircleAlert class="size-3.5 text-destructive" />
								{:else}
									<span class="inline-block size-3.5 rounded-full border border-border"></span>
								{/if}
								<span class="truncate">{fileState.name}</span>
							</li>
						{/each}
					</ul>
				{/if}

				{#if uploadError}
					<p class="text-sm text-destructive">{uploadError}</p>
				{/if}

				{#if uploadedUrls.length > 0}
					<p class="text-xs text-muted-foreground">
						The first photo is the cover — it's what buyers see in the gallery. Use the arrows to
						reorder.
					</p>
					<ul class="grid grid-cols-2 gap-4 sm:grid-cols-3">
						{#each uploadedUrls as url, index (url)}
							<li class="group relative overflow-hidden rounded-lg border border-border">
								<img
									src={url}
									alt={initialArtwork
										? `${initialArtwork.title} — photo ${index + 1}`
										: `Uploaded photo ${index + 1}`}
									class="h-36 w-full object-cover"
								/>
								{#if index === 0}
									<span
										class="absolute top-2 left-2 rounded-full bg-ink-yellow px-2 py-0.5 text-xs font-bold text-background"
									>
										Cover
									</span>
								{/if}
								<div class="absolute right-1.5 bottom-1.5 flex gap-1">
									<Button
										type="button"
										variant="secondary"
										size="icon"
										class="size-7"
										disabled={index === 0}
										aria-label="Move photo {index + 1} earlier"
										onclick={() => moveImage(index, -1)}
									>
										<ArrowLeft class="size-3.5" />
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="icon"
										class="size-7"
										disabled={index === uploadedUrls.length - 1}
										aria-label="Move photo {index + 1} later"
										onclick={() => moveImage(index, 1)}
									>
										<ArrowRight class="size-3.5" />
									</Button>
									<Button
										type="button"
										variant="destructive"
										size="icon"
										class="size-7"
										aria-label="Remove photo {index + 1}"
										onclick={() => removeImage(index)}
									>
										<X class="size-3.5" />
									</Button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<Form.Field {form} name="published">
				<Form.Control>
					{#snippet children({ props })}
						<div
							class="flex items-start gap-3 rounded-lg border border-border/70 bg-background/40 p-4"
						>
							<Checkbox {...props} bind:checked={$formData.published} id="published" />
							<div class="space-y-1">
								<Form.Label for="published" class="!mt-0 cursor-pointer font-semibold">
									Live in gallery
								</Form.Label>
								<p class="text-xs text-muted-foreground">
									When checked, this piece is visible to buyers the moment you save. Leave unchecked
									to keep it as a draft.
								</p>
							</div>
						</div>
					{/snippet}
				</Form.Control>
			</Form.Field>

			<input type="hidden" name="images" value={JSON.stringify(uploadedUrls)} />

			<div class="flex gap-2">
				<Form.Button type="submit" disabled={uploading}>
					{initialArtwork ? 'Save changes' : 'Create piece'}
				</Form.Button>
				<Button type="button" variant="outline" onclick={() => onclose?.() || goto('/dashboard')}>
					Cancel
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
