import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from './index';
import { sendEmail } from './server/email';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: 'Reset your Dead & Tattooed password',
				text: `Someone (hopefully you) asked to reset the password for ${user.email}.\n\nReset it here: ${url}\n\nIf this wasn't you, ignore this email — nothing changes.`,
				html: `<p>Someone (hopefully you) asked to reset the password for <b>${user.email}</b>.</p><p><a href="${url}">Reset your password</a></p><p>If this wasn't you, ignore this email — nothing changes.</p>`
			});
		}
	},
	emailVerification: {
		// Verified email is the gate for /account order history (orders are
		// matched by email; without verification anyone could sign up with a
		// buyer's address and read their orders + shipping info).
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: 'Verify your Dead & Tattooed email',
				text: `Confirm this address to activate your account: ${url}\n\nIf you didn't create an account, ignore this.`,
				html: `<p>Confirm this address to activate your Dead &amp; Tattooed account:</p><p><a href="${url}">Verify email</a></p><p>If you didn't create an account, ignore this.</p>`
			});
		}
	},
	// Uncomment and configure social providers when ready:
	// socialProviders: {
	// 	github: {
	// 		clientId: env.GITHUB_CLIENT_ID as string,
	// 		clientSecret: env.GITHUB_CLIENT_SECRET as string
	// 	}
	// },
	plugins: [sveltekitCookies(getRequestEvent)] //make sure this is last plugin
});
