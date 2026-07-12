import { describe, it, expect } from 'vitest';
import { productJsonLd, trimDescription } from './seo.js';

describe('trimDescription', () => {
	it('collapses whitespace and returns short text untouched', () => {
		expect(trimDescription('A  hand-tattooed\n\nspecimen.')).toBe('A hand-tattooed specimen.');
	});

	it('trims long text to the max with an ellipsis', () => {
		const result = trimDescription('x'.repeat(500), 200);
		expect(result.length).toBeLessThanOrEqual(200);
		expect(result.endsWith('…')).toBe(true);
	});

	it('handles empty input', () => {
		expect(trimDescription('')).toBe('');
	});
});

describe('productJsonLd', () => {
	const piece = {
		title: 'Piggy No. 5',
		description: 'A hand-tattooed preserved specimen.',
		images: ['https://img.example.com/a.jpg', 'https://img.example.com/b.jpg'],
		priceCents: 12000,
		status: 'available'
	};
	const url = 'https://deadandtattooed.com/products/abc123';

	it('builds a schema.org Product with an InStock offer when available', () => {
		const parsed = JSON.parse(productJsonLd(piece, url));

		expect(parsed['@type']).toBe('Product');
		expect(parsed.name).toBe('Piggy No. 5');
		expect(parsed.image).toEqual(piece.images);
		expect(parsed.offers).toEqual({
			'@type': 'Offer',
			url,
			price: '120.00',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		});
	});

	it('marks sold pieces SoldOut', () => {
		const parsed = JSON.parse(productJsonLd({ ...piece, status: 'sold' }, url));
		expect(parsed.offers.availability).toBe('https://schema.org/SoldOut');
	});

	it('omits offers when there is no price', () => {
		const parsed = JSON.parse(productJsonLd({ ...piece, priceCents: null }, url));
		expect(parsed.offers).toBeUndefined();
	});

	it('escapes < so the output cannot break out of a script tag', () => {
		const output = productJsonLd({ ...piece, title: '</script><script>alert(1)' }, url);
		expect(output).not.toContain('</script>');
		expect(output).toContain('\\u003c/script');
		// Still valid JSON after escaping
		expect(JSON.parse(output).name).toBe('</script><script>alert(1)');
	});
});
