<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let {
		heading = '',
		buttonLabel = 'Notify me'
	}: {
		heading?: string;
		buttonLabel?: string;
	} = $props();

	let email = $state('');
	let website = $state(''); // honeypot — humans never see it
	let status = $state<'idle' | 'sending' | 'done' | 'error'>('idle');
	let message = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'sending') return;
		status = 'sending';
		try {
			const body = new FormData();
			body.set('email', email);
			body.set('website', website);
			const res = await fetch('/api/subscribe', { method: 'POST', body });
			const result = await res.json().catch(() => null);
			if (res.ok) {
				status = 'done';
				message = result?.message ?? "You're on the list.";
				email = '';
			} else {
				status = 'error';
				message = result?.message ?? 'Something went wrong — try again.';
			}
		} catch {
			status = 'error';
			message = 'Something went wrong — try again.';
		}
	}
</script>

<div class="space-y-2">
	{#if heading}
		<p class="text-sm font-medium">{heading}</p>
	{/if}
	{#if status === 'done'}
		<p class="text-sm text-neon-teal" role="status">{message}</p>
	{:else}
		<form method="POST" action="/api/subscribe" onsubmit={handleSubmit} class="flex gap-2">
			<label class="sr-only" for="notify-email-{heading || 'footer'}">Email address</label>
			<Input
				id="notify-email-{heading || 'footer'}"
				type="email"
				name="email"
				bind:value={email}
				required
				placeholder="you@example.com"
				autocomplete="email"
				class="h-9 max-w-56"
			/>
			<!-- Honeypot: hidden from humans, tempting to bots -->
			<div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
				<input type="text" name="website" bind:value={website} tabindex="-1" autocomplete="off" />
			</div>
			<Button type="submit" size="sm" class="h-9" disabled={status === 'sending'}>
				{status === 'sending' ? 'Adding…' : buttonLabel}
			</Button>
		</form>
		{#if status === 'error'}
			<p class="text-sm text-destructive" role="alert">{message}</p>
		{/if}
		<p class="text-xs text-muted-foreground/80">
			Occasional emails when a new piece drops. Unsubscribe anytime.
		</p>
	{/if}
</div>
