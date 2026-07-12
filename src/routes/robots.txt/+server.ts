import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = ({ url }) => {
	const base = (env.BETTER_AUTH_URL || url.origin).replace(/\/+$/, '');

	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /dashboard',
		'Disallow: /account',
		'Disallow: /auth',
		'Disallow: /checkout',
		'Disallow: /cart',
		'',
		`Sitemap: ${base}/sitemap.xml`,
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
