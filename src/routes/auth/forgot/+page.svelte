<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let email = $state('');
	let sent = $state(false);
	let busy = $state(false);
	let errorMsg = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!email || busy) return;
		busy = true;
		errorMsg = '';
		const { error } = await authClient.requestPasswordReset({
			email,
			redirectTo: '/auth/reset'
		});
		busy = false;
		if (error) {
			errorMsg = error.message ?? 'Something went wrong. Try again.';
			return;
		}
		sent = true;
	}
</script>

<svelte:head>
	<title>Forgot password · Dead & Tattooed</title>
</svelte:head>

<div class="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Forgot your password?</Card.Title>
			<Card.Description>
				Enter your email and we'll send a reset link. It happens to the best of us.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if sent}
				<p class="text-sm" data-testid="forgot-sent">
					If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox (and
					the junk folder — preserved specimens get flagged sometimes).
				</p>
			{:else}
				<form onsubmit={submit} class="space-y-4">
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
						/>
					</div>
					{#if errorMsg}
						<p class="text-sm text-destructive">{errorMsg}</p>
					{/if}
					<Button type="submit" class="w-full" disabled={busy}>
						{busy ? 'Sending…' : 'Send reset link'}
					</Button>
				</form>
			{/if}
			<p class="mt-4 text-sm text-muted-foreground">
				<a href="/auth" class="underline underline-offset-4">Back to sign in</a>
			</p>
		</Card.Content>
	</Card.Root>
</div>
