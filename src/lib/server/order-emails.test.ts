import { describe, it, expect } from 'vitest';
import {
	buildNewOrderEmail,
	buildShippedEmail,
	shippingAddressLines,
	trackingUrl
} from './order-emails.js';

const baseOrder = {
	items: [{ name: 'Piggy No. 5', price: '120.00' }],
	buyerName: 'Morticia Addams',
	buyerEmail: 'morticia@example.com',
	shippingAddress: JSON.stringify({
		street: '1313 Cemetery Lane',
		city: 'Westfield',
		state: 'NJ',
		zip: '07090',
		country: 'US'
	}),
	total: '120.00',
	currency: 'USD',
	ordersUrl: 'https://deadandtattooed.com/dashboard/orders'
};

describe('shippingAddressLines', () => {
	it('formats the webhook address JSON into display lines', () => {
		expect(shippingAddressLines(baseOrder.shippingAddress)).toEqual([
			'1313 Cemetery Lane',
			'Westfield, NJ 07090',
			'US'
		]);
	});

	it('drops empty fields instead of printing dangling commas', () => {
		const raw = JSON.stringify({ street: '1 Main St', city: '', state: '', zip: '', country: '' });
		expect(shippingAddressLines(raw)).toEqual(['1 Main St']);
	});

	it('falls back to the raw string when the JSON is invalid', () => {
		expect(shippingAddressLines('not json at all')).toEqual(['not json at all']);
	});

	it('falls back to the raw string for non-object JSON', () => {
		expect(shippingAddressLines('"just a string"')).toEqual(['"just a string"']);
	});

	it('returns nothing for missing input', () => {
		expect(shippingAddressLines(null)).toEqual([]);
		expect(shippingAddressLines('')).toEqual([]);
	});
});

describe('trackingUrl', () => {
	it('recognizes USPS, UPS and FedEx (case-insensitively)', () => {
		expect(trackingUrl('USPS', '9400111899223344')).toBe(
			'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344'
		);
		expect(trackingUrl('ups ground', '1Z999AA10123456784')).toBe(
			'https://www.ups.com/track?tracknum=1Z999AA10123456784'
		);
		expect(trackingUrl('FedEx', '123456789012')).toBe(
			'https://www.fedex.com/fedextrack/?trknbr=123456789012'
		);
	});

	it('returns null for unrecognized carriers or missing numbers', () => {
		expect(trackingUrl('Pony Express', 'ABC123')).toBeNull();
		expect(trackingUrl(null, 'ABC123')).toBeNull();
		expect(trackingUrl('USPS', '   ')).toBeNull();
	});

	it('URL-encodes the tracking number', () => {
		expect(trackingUrl('usps', 'A B&C')).toBe(
			'https://tools.usps.com/go/TrackConfirmAction?tLabels=A%20B%26C'
		);
	});
});

describe('buildNewOrderEmail', () => {
	it('includes pieces, buyer, address, total and the dashboard link', () => {
		const email = buildNewOrderEmail(baseOrder);

		expect(email.subject).toContain('New order');
		expect(email.subject).toContain('Piggy No. 5');
		expect(email.subject).toContain('$120.00');
		expect(email.text).toContain('Piggy No. 5 — $120.00');
		expect(email.text).toContain('Morticia Addams <morticia@example.com>');
		expect(email.text).toContain('1313 Cemetery Lane');
		expect(email.text).toContain('Westfield, NJ 07090');
		expect(email.text).toContain('Total: $120.00');
		expect(email.text).toContain('https://deadandtattooed.com/dashboard/orders');
		expect(email.html).toContain('href="https://deadandtattooed.com/dashboard/orders"');
	});

	it('summarizes multi-piece orders by count', () => {
		const email = buildNewOrderEmail({
			...baseOrder,
			items: [
				{ name: 'Piggy No. 5', price: '120.00' },
				{ name: 'Moth Skull', price: '80.00' }
			],
			total: '200.00'
		});

		expect(email.subject).toContain('2 pieces');
		expect(email.text).toContain('Piggy No. 5 — $120.00');
		expect(email.text).toContain('Moth Skull — $80.00');
	});

	it('shows non-USD currency next to the total', () => {
		const email = buildNewOrderEmail({ ...baseOrder, currency: 'EUR' });
		expect(email.subject).toContain('$120.00 EUR');
	});

	it('escapes HTML in buyer-controlled fields', () => {
		const email = buildNewOrderEmail({
			...baseOrder,
			buyerName: '<script>alert(1)</script>',
			shippingAddress: JSON.stringify({ street: '<b>1 Main</b>' })
		});

		expect(email.html).not.toContain('<script>');
		expect(email.html).toContain('&lt;script&gt;');
		expect(email.html).toContain('&lt;b&gt;1 Main&lt;/b&gt;');
	});

	it('survives an empty item list and unparseable address', () => {
		const email = buildNewOrderEmail({ ...baseOrder, items: [], shippingAddress: '{oops' });
		expect(email.text).toContain('(no line items recorded)');
		expect(email.text).toContain('{oops');
	});
});

describe('buildShippedEmail', () => {
	const shipped = {
		buyerName: 'Morticia Addams',
		items: [{ name: 'Piggy No. 5' }],
		carrier: 'USPS',
		trackingNumber: '9400111899223344'
	};

	it('includes piece name, carrier, tracking number and a tracking link', () => {
		const email = buildShippedEmail(shipped);

		expect(email.subject).toContain('Piggy No. 5');
		expect(email.text).toContain('Hi Morticia Addams');
		expect(email.text).toContain('Carrier: USPS');
		expect(email.text).toContain('Tracking number: 9400111899223344');
		expect(email.text).toContain(
			'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344'
		);
		expect(email.html).toContain(
			'href="https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344"'
		);
	});

	it('shows just the number for an unrecognized carrier', () => {
		const email = buildShippedEmail({ ...shipped, carrier: 'Raven courier' });

		expect(email.text).toContain('Carrier: Raven courier');
		expect(email.text).toContain('Tracking number: 9400111899223344');
		expect(email.text).not.toContain('Track it:');
		expect(email.html).not.toContain('<a href');
	});

	it('lists every piece on multi-piece orders', () => {
		const email = buildShippedEmail({
			...shipped,
			items: [{ name: 'Piggy No. 5' }, { name: 'Moth Skull' }]
		});

		expect(email.text).toContain('• Piggy No. 5');
		expect(email.text).toContain('• Moth Skull');
		expect(email.subject).toContain('2 pieces');
	});

	it('copes with a missing carrier', () => {
		const email = buildShippedEmail({ ...shipped, carrier: null });

		expect(email.text).not.toContain('Carrier:');
		expect(email.text).toContain('Tracking number: 9400111899223344');
	});

	it('escapes HTML in buyer name and piece titles', () => {
		const email = buildShippedEmail({
			...shipped,
			buyerName: '<img src=x>',
			items: [{ name: 'Piggy <No. 5>' }]
		});

		expect(email.html).not.toContain('<img');
		expect(email.html).toContain('&lt;img src=x&gt;');
	});
});
