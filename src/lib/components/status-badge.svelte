<script lang="ts">
	/**
	 * Shared status pill for artwork availability (available / reserved / sold /
	 * draft) and order status (pending / completed / shipped / cancelled).
	 * One class map so the dashboard pieces list, dashboard orders and /account
	 * all render statuses the same way.
	 */
	const badgeClass: Record<string, string> = {
		// artwork availability
		available: 'border-acid-green/50 bg-acid-green/10 text-acid-green',
		reserved: 'border-neon-purple/60 bg-neon-purple/15 text-neon-lavender',
		sold: 'border-ink-yellow bg-ink-yellow text-background',
		draft: 'border-border bg-muted text-muted-foreground',
		// order status
		pending: 'border-border bg-muted text-muted-foreground',
		completed: 'border-acid-green/50 bg-acid-green/10 text-acid-green',
		shipped: 'border-primary/50 bg-primary/10 text-primary',
		cancelled: 'border-border bg-muted text-muted-foreground line-through'
	};

	let {
		status,
		label,
		class: className = ''
	}: { status: string; label?: string; class?: string } = $props();
</script>

<span
	class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase {badgeClass[
		status
	] ?? badgeClass.draft} {className}"
>
	{label ?? status}
</span>
