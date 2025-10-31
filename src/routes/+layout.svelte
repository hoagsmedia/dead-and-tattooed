<script>
	import '../app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics();
	
	let { children } = $props();
</script>

<div class="flex flex-col justify-center items-center mx-auto max-w-5xl sm:px-6 lg:px-8 h-dvh">
	{@render children()}
</div>
