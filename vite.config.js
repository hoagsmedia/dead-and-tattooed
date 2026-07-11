import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/**
 * Vitest 4 sets `resolve.noExternal = true` on its test environments, but Vite's
 * config merge concatenates that boolean onto the `ssr.noExternal` array provided
 * by the Svelte plugins, producing an invalid mixed array that crashes Vite's
 * externalization filter. Normalize it back to `true` (Vitest's intent).
 */
/** @returns {import('vite').Plugin} */
function fixVitestNoExternal() {
	return {
		name: 'fix-vitest-noexternal',
		enforce: 'post',
		configResolved(config) {
			/** @param {{ noExternal?: unknown } | undefined} resolveOptions */
			const fix = (resolveOptions) => {
				if (
					resolveOptions &&
					Array.isArray(resolveOptions.noExternal) &&
					resolveOptions.noExternal.some((entry) => entry === true)
				) {
					resolveOptions.noExternal = true;
				}
			};
			fix(config.ssr);
			for (const environment of Object.values(config.environments ?? {})) {
				fix(environment.resolve);
			}
		}
	};
}

export default defineConfig({
	plugins: [sveltekit(), fixVitestNoExternal()],
	ssr: {
		noExternal: ['@lucide/svelte']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
