import { error, redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect to auth if not authenticated
	if (!locals.user) {
		throw redirect(302, '/auth');
	}
	// Seller allowlist (ADMIN_EMAILS): signed-in buyers don't get a dashboard.
	if (!isAdmin(locals.user.email)) {
		throw error(
			403,
			'The dashboard is for the artist. Contact the shop if you should have access.'
		);
	}

	return {
		user: locals.user
	};
};
