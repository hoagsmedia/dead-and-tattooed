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
	// Uncomment and configure social providers when ready:
	// socialProviders: {
	// 	github: {
	// 		clientId: env.GITHUB_CLIENT_ID as string,
	// 		clientSecret: env.GITHUB_CLIENT_SECRET as string
	// 	}
	// },
	plugins: [sveltekitCookies(getRequestEvent)] //make sure this is last plugin
});
