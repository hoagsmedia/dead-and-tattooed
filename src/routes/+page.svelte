<script>
	// import Brand from './Components/Brand.svelte';
	import BrandOutlines from './Components/Brand-Outlines.svelte';
</script>

<div class="w-1/2">
	<BrandOutlines />
</div>
<div class="my-4 w-1/2">
	<a
		class="transition ease-in-out hover:drop-shadow-lg hover:scale-105 text-white w-full font-semibold rounded-lg"
		style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);"
		target="_blank"
		href="https://www.instagram.com/deadandtattooed/"
	>
		Follow on Instagram</a
	>
</div>

<h2 class="text-xl font-bold">Just a guy who stabs dead things</h2>
<article class="prose text-center">
	<p>Follow along on Instagram to see my latest work and behind-the-scenes!</p>
</article>

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.gray.100);
	}
</style>
