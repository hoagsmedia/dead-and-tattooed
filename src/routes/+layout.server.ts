import type { LayoutServerLoad } from './$types.js';
import { auth } from '$lib/auth.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user || null
	};
};

