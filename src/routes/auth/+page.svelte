<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import SigninForm from './signin-form.svelte';
	import SignupForm from './signup-form.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tabValue = $state('signin');
</script>

<div class="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Welcome</Card.Title>
			<Card.Description>Sign in to your account or create a new one</Card.Description>
		</Card.Header>
		<Card.Content>
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List class="grid w-full grid-cols-2">
					<Tabs.Trigger value="signin">Sign In</Tabs.Trigger>
					<Tabs.Trigger value="signup">Sign Up</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="signin" class="mt-6">
					<SigninForm {data} />
				</Tabs.Content>
				<Tabs.Content value="signup" class="mt-6">
					{#if form && 'verificationSent' in form && form.verificationSent}
						<p class="mb-4 text-sm text-muted-foreground" data-testid="verification-sent">
							Account created — check your email for the verification link, then sign in.
						</p>
					{/if}
					<SignupForm {data} />
				</Tabs.Content>
			</Tabs.Root>
		</Card.Content>
	</Card.Root>
</div>
