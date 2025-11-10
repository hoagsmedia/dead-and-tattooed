<script lang="ts">
	import type { LayoutData } from './$types';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	const session = authClient.useSession();

	async function handleSignOut() {
		await authClient.signOut();
		goto('/auth');
	}
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b bg-white">
		<div class="container mx-auto flex items-center justify-between px-4 py-4">
			<div class="flex items-center space-x-6">
				<a href="/dashboard" class="text-xl font-bold">Dead and Tattooed</a>
				<a href="/dashboard" class="text-sm text-gray-600 hover:text-gray-900">Dashboard</a>
				<a href="/dashboard/profile" class="text-sm text-gray-600 hover:text-gray-900">Profile</a>
			</div>
			<div class="flex items-center space-x-4">
				<span class="text-sm text-gray-600">{data.user.name || data.user.email}</span>
				<Button type="button" variant="outline" size="sm" onclick={handleSignOut}>Sign Out</Button>
			</div>
		</div>
	</nav>

	<main class="container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
