import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/**
 * Vitest merges its own `ssr.noExternal: true` into SvelteKit's noExternal
 * array, leaving a stray boolean that crashes Vite's createFilter
 * ("filename.replace is not a function"). Strip non string/RegExp entries.
 */
/** @type {import('vite').Plugin} */
const fixVitestNoExternal = {
	name: 'fix-vitest-ssr-noexternal',
	configResolved(config) {
		/** @param {{ noExternal?: unknown }} target */
		const sanitize = (target) => {
			if (Array.isArray(target?.noExternal)) {
				// Vitest wants everything inlined (`true`); honor that if present,
				// otherwise keep only valid matchers.
				target.noExternal = target.noExternal.includes(true)
					? true
					: target.noExternal.filter(
							(entry) => typeof entry === 'string' || entry instanceof RegExp
						);
			}
		};
		sanitize(config.ssr);
		for (const env of Object.values(config.environments ?? {})) {
			sanitize(env.resolve);
		}
	}
};

export default defineConfig({
	plugins: [sveltekit(), fixVitestNoExternal],
	ssr: {
		noExternal: ['@lucide/svelte']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
