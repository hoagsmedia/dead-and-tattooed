import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { nanoid } from 'nanoid';
import * as schema from '../../db/schema.js';
import { subscriber } from '../../db/schema.js';

/**
 * "Notify me" list for new-drop announcements.
 *
 * Helpers take the db client as an argument (same pattern as
 * src/lib/inventory.ts) so they can be exercised against a test database.
 * The email builders are pure so they can be unit-tested without I/O.
 */

export type AnnounceDb = NodePgDatabase<typeof schema>;

/** Lowercase + trim so "Josh@Example.com " and "josh@example.com" are one subscriber. */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Add an email to the drop list. Idempotent: subscribing twice keeps the
 * original row (and its unsubscribe token). Returns whether a new row was
 * created — callers responding to the public must NOT leak that (no
 * enumeration); it exists for tests and logging.
 */
export async function subscribe(db: AnnounceDb, email: string): Promise<{ created: boolean }> {
	const rows = await db
		.insert(subscriber)
		.values({
			id: nanoid(),
			email: normalizeEmail(email),
			unsubscribeToken: nanoid(32)
		})
		.onConflictDoNothing({ target: subscriber.email })
		.returning({ id: subscriber.id });
	return { created: rows.length > 0 };
}

/**
 * One-click unsubscribe by token (from the link in every announcement).
 * Returns whether a subscriber was actually removed.
 */
export async function unsubscribe(db: AnnounceDb, token: string): Promise<{ removed: boolean }> {
	if (!token) return { removed: false };
	const rows = await db
		.delete(subscriber)
		.where(eq(subscriber.unsubscribeToken, token))
		.returning({ id: subscriber.id });
	return { removed: rows.length > 0 };
}

export interface DropEmailPiece {
	id: string;
	title: string;
	description: string;
	/** numeric(10,2) dollars string from the db, e.g. "120.00" */
	price: string | null;
	images: string[];
}

export interface DropEmail {
	subject: string;
	text: string;
	html: string;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function formatUsd(price: string | null): string | null {
	if (!price) return null;
	const parsed = Number.parseFloat(price);
	if (Number.isNaN(parsed)) return null;
	return `$${parsed.toFixed(2)}`;
}

function trimText(text: string, max = 240): string {
	const clean = text.trim();
	if (clean.length <= max) return clean;
	return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Build the new-drop announcement email for one subscriber.
 * Every email carries that subscriber's unsubscribe link — required.
 */
export function buildDropEmail(
	piece: DropEmailPiece,
	opts: { baseUrl: string; unsubscribeToken: string }
): DropEmail {
	const baseUrl = opts.baseUrl.replace(/\/+$/, '');
	const pieceUrl = `${baseUrl}/products/${piece.id}`;
	const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(opts.unsubscribeToken)}`;
	const price = formatUsd(piece.price);
	const description = trimText(piece.description ?? '');
	const cover = piece.images[0] ?? null;

	const subject = `New piece: ${piece.title}`;

	const text = [
		`${piece.title} just landed at Dead & Tattooed.`,
		description,
		price ? `Price: ${price} — one of a kind. Once it's gone, it's gone.` : null,
		`See it: ${pieceUrl}`,
		`You're getting this because you asked for first look at new drops.\nUnsubscribe anytime: ${unsubscribeUrl}`
	]
		.filter(Boolean)
		.join('\n\n');

	const html = [
		'<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">',
		'<p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #666;">Dead &amp; Tattooed — new drop</p>',
		`<h1 style="font-size: 24px; margin: 8px 0 16px;">${escapeHtml(piece.title)}</h1>`,
		cover
			? `<a href="${escapeHtml(pieceUrl)}"><img src="${escapeHtml(cover)}" alt="${escapeHtml(piece.title)}" style="width: 100%; max-width: 560px; border-radius: 8px;" /></a>`
			: null,
		description ? `<p style="line-height: 1.6;">${escapeHtml(description)}</p>` : null,
		price
			? `<p style="font-size: 20px; font-weight: bold; margin: 16px 0 4px;">${escapeHtml(price)}</p><p style="margin: 0 0 16px; color: #666;">One of a kind — once it's gone, it's gone.</p>`
			: null,
		`<p><a href="${escapeHtml(pieceUrl)}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">See the piece</a></p>`,
		'<hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />',
		`<p style="font-size: 12px; color: #888;">You're getting this because you asked for first look at new drops. <a href="${escapeHtml(unsubscribeUrl)}" style="color: #888;">Unsubscribe</a> anytime.</p>`,
		'</div>'
	]
		.filter(Boolean)
		.join('\n');

	return { subject, text, html };
}
