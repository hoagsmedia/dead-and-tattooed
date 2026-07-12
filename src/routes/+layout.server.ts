import type { LayoutServerLoad } from './$types.js';
import { isAdmin } from '$lib/server/admin';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user || null,
		admin: isAdmin(locals.user?.email)
	};
};
