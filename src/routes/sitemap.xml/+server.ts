import type { RequestHandler } from './$types.js';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/index.js';
import { artwork } from '../../db/schema.js';

/** Canonical base URL: configured origin in prod, request origin otherwise. */
function baseUrl(requestOrigin: string): string {
	return (env.BETTER_AUTH_URL || requestOrigin).replace(/\/+$/, '');
}

export const GET: RequestHandler = async ({ url }) => {
	const base = baseUrl(url.origin);

	const pieces = await db
		.select({ id: artwork.id, updatedAt: artwork.updatedAt })
		.from(artwork)
		.where(eq(artwork.published, true))
		.orderBy(artwork.createdAt);

	const staticPages = ['/', '/products', '/info'];

	const entries = [
		...staticPages.map(
			(path) => `\t<url>\n\t\t<loc>${base}${path === '/' ? '' : path}</loc>\n\t</url>`
		),
		...pieces.map(
			(piece) =>
				`\t<url>\n\t\t<loc>${base}/products/${piece.id}</loc>\n\t\t<lastmod>${piece.updatedAt.toISOString()}</lastmod>\n\t</url>`
		)
	].join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
