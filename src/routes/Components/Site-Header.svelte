<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cart } from '$lib/stores/cart.svelte.js';
	import { ShoppingCart } from '@lucide/svelte';
	import CartSheet from '$lib/components/cart-sheet.svelte';

	let { admin = false }: { admin?: boolean } = $props();
	const session = authClient.useSession();

	let cartSheetOpen = $state(false);

	function isCurrent(path: string): 'page' | undefined {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/')
			? 'page'
			: undefined;
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/auth');
	}
</script>

<header
	class="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75"
>
	<div class="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
		<div class="flex min-w-0 items-center gap-6">
			<a
				href="/"
				class="group flex shrink-0 items-center gap-2.5"
				aria-label="Dead & Tattooed — home"
			>
				<img
					src="/jar.svg"
					alt=""
					class="h-9 w-auto transition-transform duration-300 group-hover:-rotate-6"
				/>
				<span
					class="font-display text-lg leading-none tracking-wide text-foreground uppercase sm:text-xl"
				>
					Dead <span class="text-neon-teal">&amp;</span> Tattooed
				</span>
			</a>

			<nav class="hidden items-center gap-5 sm:flex" aria-label="Main">
				<a
					href="/products"
					aria-current={isCurrent('/products')}
					class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					Gallery
				</a>
				{#if $session.data?.user}
					<a
						href="/account"
						aria-current={isCurrent('/account')}
						class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Orders
					</a>
					{#if admin}
						<a
							href="/dashboard"
							aria-current={isCurrent('/dashboard')}
							class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Dashboard
						</a>
					{/if}
				{/if}
			</nav>
		</div>

		<div class="flex items-center gap-3">
			<Sheet.Root bind:open={cartSheetOpen}>
				<Sheet.Trigger
					aria-label="Cart{cart.itemCount > 0
						? `, ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}`
						: ''}"
					class="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					<ShoppingCart class="size-5" />
					<span class="hidden md:inline">Cart</span>
					{#if cart.itemCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-yellow text-xs font-bold text-background"
						>
							{cart.itemCount}
						</span>
					{/if}
				</Sheet.Trigger>
				<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-lg">
					<Sheet.Header>
						<Sheet.Title>Your cart</Sheet.Title>
						<Sheet.Description>
							Every piece is one of a kind — it's yours until checkout, then it's gone for good.
						</Sheet.Description>
					</Sheet.Header>
					<CartSheet onClose={() => (cartSheetOpen = false)} />
				</Sheet.Content>
			</Sheet.Root>

			{#if $session.data?.user}
				<span class="hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">
					{$session.data.user.name || $session.data.user.email}
				</span>
				<Button variant="outline" size="sm" onclick={handleSignOut}>Sign out</Button>
			{:else}
				<Button variant="ghost" size="sm" href="/auth">Log in</Button>
			{/if}
		</div>
	</div>

	<!-- mobile nav row -->
	<nav
		class="container mx-auto flex items-center gap-5 px-4 pb-2 sm:hidden"
		aria-label="Main mobile"
	>
		<a
			href="/products"
			aria-current={isCurrent('/products')}
			class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
		>
			Gallery
		</a>
		{#if $session.data?.user}
			<a
				href="/account"
				aria-current={isCurrent('/account')}
				class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				Orders
			</a>
			{#if admin}
				<a
					href="/dashboard"
					aria-current={isCurrent('/dashboard')}
					class="neon-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					Dashboard
				</a>
			{/if}
		{/if}
	</nav>
</header>
