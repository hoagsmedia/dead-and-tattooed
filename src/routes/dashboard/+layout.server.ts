import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect to auth if not authenticated
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	return {
		user: locals.user
	};
};

