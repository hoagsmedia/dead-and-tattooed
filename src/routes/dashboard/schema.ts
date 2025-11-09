import { z } from 'zod';

export const artworkSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	price: z.string().optional().transform((val) => (val === '' ? undefined : val)),
	images: z.array(z.string().url()).default([]),
	published: z.boolean().default(false)
});

export type ArtworkSchema = typeof artworkSchema;

