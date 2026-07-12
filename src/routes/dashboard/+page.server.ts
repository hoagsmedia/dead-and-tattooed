import { fail, redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/index';
import { artwork, order, orderItem, subscriber } from '../../db/schema';
import { count, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { env } from '$env/dynamic/private';
import { buildDropEmail } from '$lib/server/announce';
import { sendEmail } from '$lib/server/email';

/**
 * The `description` and `status` columns are added by the integration branch.
 * Until they land in src/db/schema.ts we widen the row/insert types so this
 * code reads and persists them when present and degrades gracefully when not.
 */
type ArtworkExtras = { description?: string; status?: string | null };
type ArtworkRow = typeof artwork.$inferSelect & ArtworkExtras;

function readPublished(value: FormDataEntryValue | null): boolean {
	return value === 'true' || value === 'on';
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !isAdmin(locals.user.email)) {
		throw redirect(302, '/auth');
	}

	// Fetch user's artwork (stable ordering: oldest first, matching creation order)
	const artworks = (await db
		.select()
		.from(artwork)
		.where(eq(artwork.userId, locals.user.id))
		.orderBy(artwork.createdAt)) as ArtworkRow[];

	const artworkIds = artworks.map((a) => a.id);
	const soldIds = new Set<string>();

	if (artworkIds.length > 0) {
		const soldRows = await db
			.select({ productId: orderItem.productId })
			.from(orderItem)
			.innerJoin(order, eq(orderItem.orderId, order.id))
			.where(eq(order.status, 'completed'));

		for (const row of soldRows) {
			if (artworkIds.includes(row.productId)) {
				soldIds.add(row.productId);
			}
		}
	}

	const [{ value: subscriberCount }] = await db.select({ value: count() }).from(subscriber);

	return {
		subscriberCount,
		artworks: artworks.map((a) => {
			// Prefer the artwork.status column when present; fall back to derived state.
			let availability: 'sold' | 'reserved' | 'available' | 'draft';
			if (a.status === 'sold' || soldIds.has(a.id)) {
				availability = 'sold';
			} else if (a.status === 'reserved') {
				availability = 'reserved';
			} else if (a.published) {
				availability = 'available';
			} else {
				availability = 'draft';
			}
			return {
				...a,
				description: a.description ?? '',
				availability
			};
		})
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString();
		const price = formData.get('price')?.toString();
		const description = formData.get('description')?.toString() ?? '';
		const images = formData.get('images')?.toString();
		const published = readPublished(formData.get('published'));

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		try {
			const imageArray = images ? JSON.parse(images) : [];

			const values: typeof artwork.$inferInsert & ArtworkExtras = {
				id: nanoid(),
				title,
				price: price ? price : null,
				description,
				images: imageArray,
				published,
				userId: locals.user.id
			};

			await db.insert(artwork).values(values);

			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to create artwork' });
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const title = formData.get('title')?.toString();
		const price = formData.get('price')?.toString();
		const description = formData.get('description')?.toString() ?? '';
		const images = formData.get('images')?.toString();
		const published = readPublished(formData.get('published'));

		if (!id || !title) {
			return fail(400, { error: 'ID and title are required' });
		}

		try {
			const imageArray = images ? JSON.parse(images) : [];

			const values: Partial<typeof artwork.$inferInsert> & ArtworkExtras = {
				title,
				price: price ? price : null,
				description,
				images: imageArray,
				published
			};

			await db.update(artwork).set(values).where(eq(artwork.id, id));

			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to update artwork' });
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		try {
			await db.delete(artwork).where(eq(artwork.id, id));

			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to delete artwork' });
		}
	},

	announce: async ({ request, locals, url }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		const [piece] = await db.select().from(artwork).where(eq(artwork.id, id)).limit(1);

		if (!piece) {
			return fail(404, { error: 'Piece not found' });
		}
		if (!piece.published || piece.status !== 'available') {
			return fail(400, { error: 'Only published, available pieces can be announced.' });
		}

		const baseUrl = (env.BETTER_AUTH_URL || url.origin).replace(/\/+$/, '');
		const subscribers = await db.select().from(subscriber);

		// Sequential sends are fine at this list size; each email carries the
		// recipient's own unsubscribe link.
		let sent = 0;
		for (const sub of subscribers) {
			const email = buildDropEmail(piece, {
				baseUrl,
				unsubscribeToken: sub.unsubscribeToken
			});
			try {
				const result = await sendEmail({ to: sub.email, ...email });
				if (result.sent) sent++;
			} catch (err) {
				console.error(`[announce] send failed for ${sub.email}:`, err);
			}
		}

		return { announced: true, announcedTitle: piece.title, sent, total: subscribers.length };
	}
};
