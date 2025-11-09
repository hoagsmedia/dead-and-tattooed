import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from './index';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
	emailAndPassword: {
		enabled: true
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
