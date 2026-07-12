/**
 * SEO/social helpers for product pages. Pure functions — unit-testable.
 */

/** Trim copy to a social-preview-friendly length, on a word boundary-ish cut. */
export function trimDescription(text: string, max = 200): string {
	const clean = (text ?? '').replace(/\s+/g, ' ').trim();
	if (clean.length <= max) return clean;
	return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export interface ProductSeoPiece {
	title: string;
	description: string;
	images: string[];
	priceCents: number | null;
	status: string;
}

/**
 * Product JSON-LD (schema.org), returned as a string safe to inject via
 * {@html}: `<` is escaped as `\u003c` so piece copy can never break out of the
 * <script type="application/ld+json"> tag.
 */
export function productJsonLd(piece: ProductSeoPiece, pageUrl: string): string {
	const data: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: piece.title,
		image: piece.images,
		description: trimDescription(piece.description)
	};
	if (piece.priceCents !== null) {
		data.offers = {
			'@type': 'Offer',
			url: pageUrl,
			price: (piece.priceCents / 100).toFixed(2),
			priceCurrency: 'USD',
			availability:
				piece.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'
		};
	}
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
