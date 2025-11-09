import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/index';
import { artwork } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	// Fetch user's artwork
	const artworks = await db
		.select()
		.from(artwork)
		.where(eq(artwork.userId, locals.user.id))
		.orderBy(artwork.createdAt);

	return {
		artworks
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
		const images = formData.get('images')?.toString();
		const published = formData.get('published') === 'true';

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		try {
			const imageArray = images ? JSON.parse(images) : [];

			await db.insert(artwork).values({
				id: nanoid(),
				title,
				price: price ? price : null,
				images: imageArray,
				published,
				userId: locals.user.id
			});

			return { success: true };
		} catch (error) {
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
		const images = formData.get('images')?.toString();
		const published = formData.get('published') === 'true';

		if (!id || !title) {
			return fail(400, { error: 'ID and title are required' });
		}

		try {
			const imageArray = images ? JSON.parse(images) : [];

			await db
				.update(artwork)
				.set({
					title,
					price: price ? price : null,
					images: imageArray,
					published
				})
				.where(eq(artwork.id, id));

			return { success: true };
		} catch (error) {
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
		} catch (error) {
			return fail(500, { error: 'Failed to delete artwork' });
		}
	}
};

