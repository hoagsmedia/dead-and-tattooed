<script lang="ts">
	import BrandOutlines from './Components/Brand-Outlines.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Instagram, ArrowRight } from '@lucide/svelte';

	const steps = [
		{
			n: '01',
			title: 'Tattooed by hand',
			body: 'Every specimen gets a real tattoo — needle, ink, steady hands, hours of work. Same craft as skin. Far more patient canvas.',
			accent: 'var(--neon-teal)'
		},
		{
			n: '02',
			title: 'Preserved in glass',
			body: 'Each piece is professionally preserved and sealed in its own jar, so the ink stays exactly as it looked the day it was finished.',
			accent: 'var(--neon-purple)'
		},
		{
			n: '03',
			title: 'Shipped to your shelf',
			body: 'Packed like the museum artifact it is and sent to its forever home. Display proudly. Conversations will start themselves.',
			accent: 'var(--ink-yellow)'
		}
	];
</script>

<svelte:head>
	<title>Dead &amp; Tattooed — one-of-a-kind tattooed specimens in jars</title>
	<meta
		name="description"
		content="Hand-tattooed, preserved pig's feet sealed in glass jars. One-of-one collectible art from a tattoo artist who takes dead things very seriously."
	/>
	<meta property="og:title" content="Dead & Tattooed — one-of-a-kind tattooed specimens" />
	<meta
		property="og:description"
		content="Hand-tattooed, preserved specimens sealed in glass. Every piece is a one-of-one — when it's gone, it's gone."
	/>
</svelte:head>

<div class="relative w-full overflow-hidden">
	<!-- decorative splotches (brand-tinted via mask) -->
	<div
		class="splotch absolute -top-10 -left-16 h-56 w-56 rotate-12 opacity-[0.07]"
		style="--splotch-color: var(--neon-purple)"
		aria-hidden="true"
	></div>
	<div
		class="splotch absolute top-1/3 -right-20 h-72 w-72 -rotate-45 opacity-[0.06]"
		style="--splotch-color: var(--neon-teal)"
		aria-hidden="true"
	></div>
	<div
		class="splotch absolute bottom-10 left-1/4 h-40 w-40 rotate-90 opacity-[0.05]"
		style="--splotch-color: var(--ink-yellow)"
		aria-hidden="true"
	></div>

	<!-- Hero -->
	<section
		class="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 pt-8 pb-16 text-center"
	>
		<div class="animate-slide-up w-full max-w-sm">
			<BrandOutlines />
		</div>

		<div class="animate-slide-up animation-delay-200 space-y-5">
			<p class="text-xs font-semibold tracking-[0.3em] text-neon-teal uppercase">
				One-of-one specimens &middot; tattooed by hand
			</p>
			<h1 class="font-display text-4xl tracking-wide uppercase sm:text-6xl">
				Ink that outlives <span class="text-neon-purple">everything</span>
			</h1>
			<p class="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
				Real tattoos on preserved pig's feet, sealed in glass jars. Each one is a single, signed
				original — part folk art, part science exhibit, entirely itself.
			</p>
		</div>

		<div class="animate-slide-up animation-delay-400 flex flex-col items-center gap-3 sm:flex-row">
			<Button href="/products" size="lg" class="group h-12 px-8 text-base font-semibold">
				View the gallery
				<ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-1" />
			</Button>
			<Button
				href="https://www.instagram.com/deadandtattooed/"
				target="_blank"
				variant="outline"
				size="lg"
				class="h-12 px-6 text-base"
			>
				<Instagram class="size-4" />
				Watch the work
			</Button>
		</div>
	</section>

	<!-- How it works -->
	<section class="relative mx-auto w-full max-w-4xl px-4 pb-16" aria-labelledby="how-it-works">
		<div class="mb-8 flex items-end justify-between gap-4">
			<h2 id="how-it-works" class="font-display text-2xl tracking-wide uppercase sm:text-3xl">
				How a foot ends up famous
			</h2>
			<img src="/pig.svg" alt="" class="h-14 w-auto opacity-80 sm:h-20" aria-hidden="true" />
		</div>

		<ol class="grid gap-4 sm:grid-cols-3">
			{#each steps as step (step.n)}
				<li
					class="rounded-xl border border-border/70 bg-card p-6 transition-colors duration-200 hover:border-[color:var(--step-accent)]"
					style="--step-accent: {step.accent}"
				>
					<span class="font-display text-3xl" style="color: {step.accent}" aria-hidden="true">
						{step.n}
					</span>
					<h3 class="mt-3 mb-2 text-lg font-semibold">{step.title}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
				</li>
			{/each}
		</ol>
	</section>

	<!-- Honesty strip -->
	<section class="relative mx-auto w-full max-w-4xl px-4 pb-8">
		<div
			class="flex flex-col items-center gap-6 rounded-xl border border-ink-yellow/40 bg-card px-6 py-8 text-center sm:flex-row sm:text-left"
		>
			<img src="/jar.svg" alt="" class="h-24 w-auto shrink-0" aria-hidden="true" />
			<div class="space-y-2">
				<p class="font-display text-xl tracking-wide text-ink-yellow uppercase">
					When it's gone, it's gone
				</p>
				<p class="text-sm leading-relaxed text-muted-foreground">
					Every piece in the gallery is a one-of-one. No editions, no reprints, no "back in stock
					soon." Once a specimen finds its person, that's it — the jar, the ink, and the story go
					home together.
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.splotch {
		background-color: var(--splotch-color);
		mask: url('/splotch-solid.svg') center / contain no-repeat;
		-webkit-mask: url('/splotch-solid.svg') center / contain no-repeat;
		pointer-events: none;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.6s ease-out forwards;
		opacity: 0;
	}

	.animation-delay-200 {
		animation-delay: 200ms;
	}

	.animation-delay-400 {
		animation-delay: 400ms;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-slide-up {
			animation: none;
			opacity: 1;
		}
	}
</style>
