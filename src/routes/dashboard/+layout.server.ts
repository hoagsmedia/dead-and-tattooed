import { requireAdmin } from '$lib/server/admin';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Seller allowlist (ADMIN_EMAILS): signed-in buyers don't get a dashboard.
	// NOTE: layout loads do NOT run for form actions — every dashboard action
	// must call requireAdmin itself.
	const user = requireAdmin(locals);

	return { user };
};
