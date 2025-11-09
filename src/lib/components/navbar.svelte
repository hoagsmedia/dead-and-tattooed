<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import type { LayoutData } from '../routes/$types.js';

	let { data }: { data: LayoutData } = $props();
	const session = authClient.useSession();

	function handleLogin() {
		goto('/auth');
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/auth');
	}
</script>

<nav class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<div class="flex items-center gap-6">
			<a href="/" class="flex items-center space-x-2 font-bold text-xl">
				<span>Dead and Tattooed</span>
			</a>
			<a href="/products" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				Products
			</a>
		</div>

		<div class="flex items-center gap-4">
			{#if $session.data?.user}
				<div class="flex items-center gap-4">
					<a href="/dashboard" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
						Dashboard
					</a>
					<span class="text-sm text-muted-foreground">
						{$session.data.user.name || $session.data.user.email}
					</span>
					<Button variant="outline" size="sm" onclick={handleSignOut}>
						Sign Out
					</Button>
				</div>
			{:else}
				<Button variant="default" size="sm" onclick={handleLogin}>
					Login
				</Button>
			{/if}
		</div>
	</div>
</nav>

