import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/index';
import { artwork, order, orderItem } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
	if (!locals.user) {
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

	return {
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
		if (!locals.user) {
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
		if (!locals.user) {
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
		if (!locals.user) {
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
	}
};
