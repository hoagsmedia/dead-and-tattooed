import { z } from 'zod';

export const artworkSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	price: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => (val === '' || val === undefined ? undefined : String(val))),
	description: z.string().max(5000, 'Keep the description under 5000 characters').default(''),
	images: z.array(z.string().url()).default([]),
	published: z.boolean().default(false)
});

export type ArtworkSchema = typeof artworkSchema;
