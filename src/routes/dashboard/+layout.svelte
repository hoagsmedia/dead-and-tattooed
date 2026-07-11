<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/state';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const tabs = [
		{ href: '/dashboard', label: 'Pieces' },
		{ href: '/dashboard/profile', label: 'Profile' }
	];

	function isCurrent(href: string): boolean {
		return href === '/dashboard'
			? page.url.pathname === '/dashboard'
			: page.url.pathname.startsWith(href);
	}
</script>

<div class="w-full space-y-8">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
		<nav class="flex gap-5" aria-label="Dashboard">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					aria-current={isCurrent(tab.href) ? 'page' : undefined}
					class="neon-underline text-sm font-medium transition-colors {isCurrent(tab.href)
						? 'text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
		<span class="text-xs text-muted-foreground">
			Signed in as {data.user.name || data.user.email}
		</span>
	</div>

	{@render children()}
</div>
