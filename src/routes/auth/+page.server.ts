import type { PageServerLoad, Actions } from './$types.js';

import { fail, redirect, isRedirect } from '@sveltejs/kit';

import { superValidate } from 'sveltekit-superforms';

import { zod4 } from 'sveltekit-superforms/adapters';

import { signInSchema, signUpSchema } from './schema.js';

import { auth } from '$lib/auth.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	return {
		signInForm: await superValidate(
			zod4(signInSchema, {
				defaults: {
					email: 'mrjoshhoagland@gmail.com',
					password: 'password',
					rememberMe: true
				}
			})
		),
		signUpForm: await superValidate(zod4(signUpSchema))
	};
};

export const actions: Actions = {
	signIn: async (event) => {
		const form = await superValidate(event, zod4(signInSchema));

		if (!form.valid) {
			return fail(400, {
				signInForm: form
			});
		}

		try {
			await auth.api.signInEmail({
				body: {
					email: form.data.email,
					password: form.data.password,
					rememberMe: form.data.rememberMe
				},
				headers: event.request.headers
			});

			throw redirect(302, '/dashboard');
		} catch (error) {
			// Re-throw redirects
			if (isRedirect(error)) {
				throw error;
			}

			return fail(400, {
				signInForm: {
					...form,
					errors: {
						...form.errors,
						_password: ['Invalid email or password']
					}
				}
			});
		}
	},

	signUp: async (event) => {
		const form = await superValidate(event, zod4(signUpSchema));

		if (!form.valid) {
			return fail(400, {
				signUpForm: form
			});
		}

		try {
			await auth.api.signUpEmail({
				body: {
					name: form.data.name,
					email: form.data.email,
					password: form.data.password
				},
				headers: event.request.headers
			});

			throw redirect(302, '/dashboard');
		} catch (error) {
			// Re-throw redirects
			if (isRedirect(error)) {
				throw error;
			}

			return fail(400, {
				signUpForm: {
					...form,
					errors: {
						...form.errors,
						_email: [error instanceof Error ? error.message : 'Sign up failed']
					}
				}
			});
		}
	}
};
