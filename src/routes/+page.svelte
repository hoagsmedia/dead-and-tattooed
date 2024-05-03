<script>
	import Brand from './Components/Brand.svelte';
	import BrandOutlines from './Components/Brand-Outlines.svelte';
</script>

<div class="w-1/2">
	<BrandOutlines />
</div>
<div class="my-4 w-1/2">
	<a
		class=" transition ease-in-out btn bg-black hover:bg-gray-800 hover:drop-shadow-lg hover:scale-105 text-white w-full"
		target="_blank"
		href="https://www.etsy.com/shop/DeadandTattooed"
	>
		Shop on Etsy</a
	>
</div>

<h2 class="text-xl font-bold">Just a guy who stabs dead things</h2>
<article class="prose text-center">
	<p>Come check out my store.</p>
</article>

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.gray.100);
	}
</style>
