import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/index';
import { user } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateProfileSchema, changePasswordSchema } from './schema';
import { requireAdmin } from '$lib/server/admin';

// This page lives under the admin-gated dashboard layout, but layout loads do
// NOT run for form actions — without their own gate, ANY signed-in user could
// POST here and rewrite their account email to an arbitrary address (a buyer's
// address to read their orders, or an ADMIN_EMAILS address to take the
// dashboard). Both loads and actions therefore call requireAdmin themselves.

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = requireAdmin(locals);

	return {
		updateProfileForm: await superValidate(
			{
				name: currentUser.name || '',
				email: currentUser.email || ''
			},
			zod4(updateProfileSchema)
		),
		changePasswordForm: await superValidate(zod4(changePasswordSchema))
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const currentUser = requireAdmin(locals);

		const form = await superValidate(request, zod4(updateProfileSchema));

		if (!form.valid) {
			return fail(400, { updateProfileForm: form });
		}

		const emailChanged =
			form.data.email.trim().toLowerCase() !== currentUser.email.trim().toLowerCase();

		try {
			// Update user directly in database. A changed email is UNVERIFIED
			// until its owner clicks the link — verified status must never carry
			// over to an address the account holder hasn't proven they control.
			await db
				.update(user)
				.set({
					name: form.data.name,
					email: form.data.email,
					...(emailChanged ? { emailVerified: false } : {})
				})
				.where(eq(user.id, currentUser.id));

			if (emailChanged) {
				try {
					await auth.api.sendVerificationEmail({
						body: { email: form.data.email },
						headers: request.headers
					});
				} catch (err) {
					// Non-fatal: they can re-request from /account or on next sign-in.
					console.error('Failed to send verification email after email change:', err);
				}
			}

			return { updateProfileForm: form, success: true, emailChanged };
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
		requireAdmin(locals);

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
