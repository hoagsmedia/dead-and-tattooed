/**
 * Pure builders for order-lifecycle emails. No env access, no I/O — everything
 * (base URLs, order data) comes in as arguments so these are unit-testable.
 * Actual sending happens at the call sites via `sendEmail` in ./email.ts.
 */

import { escapeHtml } from './html.js';

export type OrderEmailItem = {
	name: string;
	/** Numeric string, e.g. "120.00" (matches the numeric columns). */
	price: string;
};

export type NewOrderEmailInput = {
	items: OrderEmailItem[];
	buyerName: string;
	buyerEmail: string;
	/** Raw `order.shippingAddress` JSON string — parsed defensively. */
	shippingAddress: string;
	/** Numeric string, e.g. "120.00". */
	total: string;
	/** e.g. "USD" */
	currency: string;
	/** Absolute link to the orders dashboard. */
	ordersUrl: string;
};

export type ShippedEmailInput = {
	buyerName: string;
	items: { name: string }[];
	carrier: string | null;
	trackingNumber: string;
};

export type BuiltEmail = { subject: string; text: string; html: string };

function formatMoney(amount: string, currency?: string): string {
	const n = Number(amount);
	const base = Number.isNaN(n) ? `$${amount}` : `$${n.toFixed(2)}`;
	const cur = (currency ?? '').toUpperCase();
	return cur && cur !== 'USD' ? `${base} ${cur}` : base;
}

/**
 * Parse the shipping address JSON stored on the order into display lines.
 * Defensive: bad JSON or unexpected shapes fall back to the raw string
 * (or nothing) instead of throwing mid-email.
 */
export function shippingAddressLines(raw: string | null | undefined): string[] {
	if (!raw) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [raw];
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		return [raw];
	}
	const addr = parsed as Record<string, unknown>;
	const pick = (key: string) => (typeof addr[key] === 'string' ? (addr[key] as string).trim() : '');
	const street = pick('street');
	const cityStateZip = [pick('city'), [pick('state'), pick('zip')].filter(Boolean).join(' ')]
		.filter(Boolean)
		.join(', ');
	const country = pick('country');
	return [street, cityStateZip, country].filter(Boolean);
}

/**
 * Tracking URL for carriers we recognize (USPS / UPS / FedEx); null for
 * anything else — callers then just show the raw number.
 */
export function trackingUrl(
	carrier: string | null | undefined,
	trackingNumber: string
): string | null {
	const c = (carrier ?? '').toLowerCase();
	const num = encodeURIComponent(trackingNumber.trim());
	if (!num) return null;
	if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
	if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${num}`;
	if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
	return null;
}

/** Owner notification sent when a checkout completes. */
export function buildNewOrderEmail(input: NewOrderEmailInput): BuiltEmail {
	const pieceSummary =
		input.items.length === 1 ? `“${input.items[0].name}”` : `${input.items.length} pieces`;
	const subject = `New order — ${pieceSummary} · ${formatMoney(input.total, input.currency)}`;

	const itemLines = input.items.map((i) => `  • ${i.name} — ${formatMoney(i.price)}`);
	const addressLines = shippingAddressLines(input.shippingAddress);

	const text = [
		'A piece just found a new home.',
		'',
		'Sold:',
		...(itemLines.length ? itemLines : ['  • (no line items recorded)']),
		'',
		`Buyer: ${input.buyerName} <${input.buyerEmail}>`,
		'Ships to:',
		...(addressLines.length ? addressLines.map((l) => `  ${l}`) : ['  (no address on file)']),
		'',
		`Total: ${formatMoney(input.total, input.currency)}`,
		'',
		`Pack it up: ${input.ordersUrl}`
	].join('\n');

	const itemsHtml = (
		input.items.length
			? input.items.map(
					(i) => `<li>${escapeHtml(i.name)} — ${escapeHtml(formatMoney(i.price))}</li>`
				)
			: ['<li>(no line items recorded)</li>']
	).join('');
	const addressHtml = addressLines.length
		? addressLines.map(escapeHtml).join('<br>')
		: '(no address on file)';

	const html = [
		'<p>A piece just found a new home.</p>',
		`<p><strong>Sold:</strong></p><ul>${itemsHtml}</ul>`,
		`<p><strong>Buyer:</strong> ${escapeHtml(input.buyerName)} &lt;${escapeHtml(input.buyerEmail)}&gt;</p>`,
		`<p><strong>Ships to:</strong><br>${addressHtml}</p>`,
		`<p><strong>Total:</strong> ${escapeHtml(formatMoney(input.total, input.currency))}</p>`,
		`<p><a href="${escapeHtml(input.ordersUrl)}">Pack it up →</a></p>`
	].join('\n');

	return { subject, text, html };
}

/** Buyer notification sent when the artist marks the order shipped. */
export function buildShippedEmail(input: ShippedEmailInput): BuiltEmail {
	const names = input.items.map((i) => i.name);
	const pieceSummary =
		names.length === 0
			? 'Your piece'
			: names.length === 1
				? `“${names[0]}”`
				: `Your ${names.length} pieces`;

	const subject = `${pieceSummary} ${names.length > 1 ? 'have' : 'has'} left the crypt — Dead & Tattooed`;
	const carrierLabel = input.carrier?.trim() || null;
	const url = trackingUrl(carrierLabel, input.trackingNumber);
	const oneLiner =
		names.length > 1
			? 'They survived the tattoo needle; the postal service should be nothing.'
			: 'It survived the tattoo needle; the postal service should be nothing.';

	const text = [
		`Hi ${input.buyerName},`,
		'',
		`${pieceSummary} ${names.length > 1 ? 'are' : 'is'} boxed up and on the way to you. ${oneLiner}`,
		'',
		...(names.length > 1 ? [...names.map((n) => `  • ${n}`), ''] : []),
		...(carrierLabel ? [`Carrier: ${carrierLabel}`] : []),
		`Tracking number: ${input.trackingNumber}`,
		...(url ? [`Track it: ${url}`] : []),
		'',
		'Give it a good wall.',
		'',
		'— Dead & Tattooed'
	].join('\n');

	const listHtml =
		names.length > 1 ? `<ul>${names.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : '';
	const trackingHtml = url
		? `<a href="${escapeHtml(url)}">${escapeHtml(input.trackingNumber)}</a>`
		: escapeHtml(input.trackingNumber);

	const html = [
		`<p>Hi ${escapeHtml(input.buyerName)},</p>`,
		`<p>${escapeHtml(pieceSummary)} ${names.length > 1 ? 'are' : 'is'} boxed up and on the way to you. ${escapeHtml(oneLiner)}</p>`,
		listHtml,
		`<p>${carrierLabel ? `<strong>Carrier:</strong> ${escapeHtml(carrierLabel)}<br>` : ''}<strong>Tracking:</strong> ${trackingHtml}</p>`,
		'<p>Give it a good wall.</p>',
		'<p>— Dead &amp; Tattooed</p>'
	]
		.filter(Boolean)
		.join('\n');

	return { subject, text, html };
}
