import type { PageServerLoad } from './$types.js';
import { db } from '$lib/index.js';
import { unsubscribe } from '$lib/server/announce.js';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const { removed } = await unsubscribe(db, token);
	// Friendly either way: an already-used/unknown token still lands on a
	// confirmation, never an error page.
	return { removed };
};
