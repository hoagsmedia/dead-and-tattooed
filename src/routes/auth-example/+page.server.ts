import { auth } from '$lib/auth';
import { requireAdmin } from '$lib/server/admin';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// This route is a development scaffold (generic forms, off-brand styling) and
// must never be reachable by the public. The proper storefront sign-in lives at
// /auth. We guard the load and every action with the same requireAdmin gate the
// dashboard uses, so only allowlisted (ADMIN_EMAILS) sellers can load or submit.
export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	return {};
};

export const actions: Actions = {
	signUp: async ({ request, locals }) => {
		requireAdmin(locals);
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!name || !email || !password) {
			return fail(400, {
				error: 'Name, email, and password are required',
				form: 'signUp'
			});
		}

		try {
			await auth.api.signUpEmail({
				body: {
					name,
					email,
					password
				},
				headers: request.headers
			});

			return { success: true, form: 'signUp' };
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Sign up failed',
				form: 'signUp',
				email
			});
		}
	},

	signIn: async ({ request, locals }) => {
		requireAdmin(locals);
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const rememberMe = formData.get('rememberMe') === 'true';

		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				form: 'signIn'
			});
		}

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
					rememberMe
				},
				headers: request.headers
			});

			return { success: true, form: 'signIn' };
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Sign in failed',
				form: 'signIn',
				email
			});
		}
	},

	signOut: async ({ request, locals }) => {
		requireAdmin(locals);
		try {
			await auth.api.signOut({
				headers: request.headers
			});

			return { success: true, form: 'signOut' };
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Sign out failed',
				form: 'signOut'
			});
		}
	}
};
