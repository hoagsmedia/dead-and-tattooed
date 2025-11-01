<script lang="ts">
	import BrandOutlines from './Components/Brand-Outlines.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Instagram } from '@lucide/svelte';
</script>

<div class="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto px-4 py-12 animate-fade-in">
	<!-- Brand Logo Section -->
	<div class="w-full max-w-md animate-slide-up">
		<BrandOutlines />
	</div>

	<!-- CTA Section -->
	<div class="w-full max-w-sm space-y-6 animate-slide-up animation-delay-200">
		<Button
			class="group relative w-full h-12 text-white font-semibold rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-linear-65 from-[#f09433] from-0% via-[#e6683c] via-25% to-[#bc1888] to-90%"
			variant="default"
			disabled={false}
			target="_blank"
			href="https://www.instagram.com/deadandtattooed/"
		>
			<div class="flex items-center justify-center gap-2">
				<Instagram class="size-5 group-hover:scale-110 transition-transform duration-300" />
				<span>Follow on Instagram</span>
			</div>
		</Button>
	</div>

	<!-- Content Section -->
	<div class="text-center space-y-4 animate-slide-up animation-delay-400">
		<h2 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
			Just a guy who stabs dead things
		</h2>
		<article class="prose prose-lg prose-slate max-w-none text-muted-foreground">
			<p class="text-lg leading-relaxed">Follow along on Instagram to see my latest work</p>
		</article>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
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

	.animate-fade-in {
		animation: fade-in 0.6s ease-out;
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
</style>
