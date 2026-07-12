<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let password = $state('');
	let confirm = $state('');
	let busy = $state(false);
	let errorMsg = $state('');

	// Better Auth appends ?token=… to the redirectTo URL; ?error=… on bad links.
	const token = $derived(page.url.searchParams.get('token'));
	const linkError = $derived(page.url.searchParams.get('error'));

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		if (password.length < 8) {
			errorMsg = 'Password must be at least 8 characters.';
			return;
		}
		if (password !== confirm) {
			errorMsg = "Passwords don't match.";
			return;
		}
		if (!token) {
			errorMsg = 'This reset link is missing its token — request a new one.';
			return;
		}
		busy = true;
		errorMsg = '';
		const { error } = await authClient.resetPassword({ newPassword: password, token });
		busy = false;
		if (error) {
			errorMsg = error.message ?? 'Reset failed — the link may have expired. Request a new one.';
			return;
		}
		await goto('/auth?reset=done');
	}
</script>

<svelte:head>
	<title>Reset password · Dead & Tattooed</title>
</svelte:head>

<div class="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Choose a new password</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if linkError || !token}
				<p class="text-sm text-destructive">
					This reset link is invalid or expired.
					<a href="/auth/forgot" class="underline underline-offset-4">Request a new one.</a>
				</p>
			{:else}
				<form onsubmit={submit} class="space-y-4">
					<div class="space-y-2">
						<Label for="password">New password</Label>
						<Input id="password" type="password" bind:value={password} required minlength={8} />
					</div>
					<div class="space-y-2">
						<Label for="confirm">Confirm password</Label>
						<Input id="confirm" type="password" bind:value={confirm} required />
					</div>
					{#if errorMsg}
						<p class="text-sm text-destructive">{errorMsg}</p>
					{/if}
					<Button type="submit" class="w-full" disabled={busy}>
						{busy ? 'Saving…' : 'Set new password'}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
