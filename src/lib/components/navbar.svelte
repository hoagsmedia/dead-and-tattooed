<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import type { LayoutData } from '../../routes/$types';
	import { cart } from '$lib/stores/cart.svelte.js';
	import { ShoppingCart } from '@lucide/svelte';
	import CartSheet from '$lib/components/cart-sheet.svelte';

	let { data }: { data: LayoutData } = $props();
	const session = authClient.useSession();

	let cartSheetOpen = $state(false);

	function handleLogin() {
		goto('/auth');
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/auth');
	}
</script>

<nav class="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<div class="flex items-center gap-6">
			<a href="/" class="flex items-center space-x-2 font-bold text-xl">
				<span>Dead and Tattooed</span>
			</a>
			<a
				href="/products"
				class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
			>
				Products
			</a>
		</div>

		<div class="flex items-center gap-4">
			<Sheet.Root bind:open={cartSheetOpen}>
				<Sheet.Trigger
					class="relative inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
				>
					<ShoppingCart class="size-5" />
					{#if cart.itemCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
						>
							{cart.itemCount}
						</span>
					{/if}
				</Sheet.Trigger>
				<Sheet.Content side="right" class="w-full sm:max-w-lg flex flex-col">
					<Sheet.Header>
						<Sheet.Title>Shopping Cart</Sheet.Title>
						<Sheet.Description>Review your items before checkout</Sheet.Description>
					</Sheet.Header>
					<CartSheet onClose={() => (cartSheetOpen = false)} />
				</Sheet.Content>
			</Sheet.Root>

			{#if $session.data?.user}
				<div class="flex items-center gap-4">
					<a
						href="/dashboard"
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Dashboard
					</a>
					<span class="text-sm text-muted-foreground">
						{$session.data.user.name || $session.data.user.email}
					</span>
					<Button variant="outline" size="sm" onclick={handleSignOut}>Sign Out</Button>
				</div>
			{:else}
				<Button variant="default" size="sm" onclick={handleLogin}>Login</Button>
			{/if}
		</div>
	</div>
</nav>
