import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/index';
import { user } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateProfileSchema, changePasswordSchema } from './schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	return {
		updateProfileForm: await superValidate(
			{
				name: locals.user.name || '',
				email: locals.user.email || ''
			},
			zod4(updateProfileSchema)
		),
		changePasswordForm: await superValidate(zod4(changePasswordSchema))
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const form = await superValidate(request, zod4(updateProfileSchema));

		if (!form.valid) {
			return fail(400, { updateProfileForm: form });
		}

		try {
			// Update user directly in database
			await db
				.update(user)
				.set({
					name: form.data.name,
					email: form.data.email
				})
				.where(eq(user.id, locals.user.id));

			return { updateProfileForm: form, success: true };
		} catch (error) {
			return fail(400, {
				updateProfileForm: {
					...form,
					errors: {
						...form.errors,
						_email: [error instanceof Error ? error.message : 'Failed to update profile']
					}
				}
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const form = await superValidate(request, zod4(changePasswordSchema));

		if (!form.valid) {
			return fail(400, { changePasswordForm: form });
		}

		try {
			await auth.api.changePassword({
				body: {
					currentPassword: form.data.currentPassword,
					newPassword: form.data.newPassword
				},
				headers: request.headers
			});

			return { changePasswordForm: form, success: true };
		} catch (error) {
			return fail(400, {
				changePasswordForm: {
					...form,
					errors: {
						...form.errors,
						_currentPassword: [error instanceof Error ? error.message : 'Failed to change password']
					}
				}
			});
		}
	}
};
