import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq, like } from 'drizzle-orm';
import * as schema from '../../db/schema.js';
import { subscriber } from '../../db/schema.js';
import { buildDropEmail, normalizeEmail, subscribe, unsubscribe } from './announce.js';

const connectionString =
	process.env.DATABASE_URL ?? 'postgresql://frugr:frugr@localhost:5432/dnt_dev_g';

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool, { schema });

const TEST_DOMAIN = 'announce-test.example.com';

let seq = 0;
function testEmail(): string {
	return `drop-${Date.now()}-${seq++}@${TEST_DOMAIN}`;
}

async function getSubscriber(email: string) {
	const [row] = await db
		.select()
		.from(subscriber)
		.where(eq(subscriber.email, email.toLowerCase()))
		.limit(1);
	return row;
}

afterEach(async () => {
	await db.delete(subscriber).where(like(subscriber.email, `%@${TEST_DOMAIN}`));
});

afterAll(async () => {
	await pool.end();
});

describe('subscribe', () => {
	it('creates a subscriber with a nanoid id and unsubscribe token', async () => {
		const email = testEmail();

		const result = await subscribe(db, email);

		expect(result.created).toBe(true);
		const row = await getSubscriber(email);
		expect(row).toBeDefined();
		expect(row.id.length).toBeGreaterThanOrEqual(21);
		expect(row.unsubscribeToken.length).toBeGreaterThanOrEqual(32);
		expect(row.email).toBe(email.toLowerCase());
	});

	it('normalizes case/whitespace so one address is one subscriber', async () => {
		const email = testEmail();

		await subscribe(db, `  ${email.toUpperCase()}  `);
		const second = await subscribe(db, email);

		expect(second.created).toBe(false);
		const rows = await db.select().from(subscriber).where(eq(subscriber.email, email));
		expect(rows).toHaveLength(1);
	});

	it('keeps the original unsubscribe token on repeat signup', async () => {
		const email = testEmail();

		await subscribe(db, email);
		const before = await getSubscriber(email);
		await subscribe(db, email);
		const after = await getSubscriber(email);

		expect(after.unsubscribeToken).toBe(before.unsubscribeToken);
	});
});

describe('unsubscribe', () => {
	it('removes the subscriber for a valid token', async () => {
		const email = testEmail();
		await subscribe(db, email);
		const row = await getSubscriber(email);

		const result = await unsubscribe(db, row.unsubscribeToken);

		expect(result.removed).toBe(true);
		expect(await getSubscriber(email)).toBeUndefined();
	});

	it('is a no-op for unknown or empty tokens', async () => {
		const email = testEmail();
		await subscribe(db, email);

		expect((await unsubscribe(db, 'not-a-real-token')).removed).toBe(false);
		expect((await unsubscribe(db, '')).removed).toBe(false);
		expect(await getSubscriber(email)).toBeDefined();
	});
});

describe('normalizeEmail', () => {
	it('lowercases and trims', () => {
		expect(normalizeEmail('  Josh@Example.COM ')).toBe('josh@example.com');
	});
});

describe('buildDropEmail', () => {
	const piece = {
		id: 'abc123',
		title: 'Piggy No. 5',
		description: 'A hand-tattooed preserved specimen.',
		price: '120.00',
		images: ['https://img.example.com/piggy.jpg', 'https://img.example.com/piggy-2.jpg']
	};
	const opts = { baseUrl: 'https://deadandtattooed.com', unsubscribeToken: 'tok_123' };

	it('builds subject, piece link, price, and cover image', () => {
		const email = buildDropEmail(piece, opts);

		expect(email.subject).toBe('New piece: Piggy No. 5');
		expect(email.text).toContain('https://deadandtattooed.com/products/abc123');
		expect(email.text).toContain('$120.00');
		expect(email.html).toContain('https://img.example.com/piggy.jpg');
		expect(email.html).toContain('https://deadandtattooed.com/products/abc123');
		expect(email.html).toContain('$120.00');
	});

	it('always includes the unsubscribe link in text and html', () => {
		const email = buildDropEmail(piece, opts);

		expect(email.text).toContain('https://deadandtattooed.com/unsubscribe?token=tok_123');
		expect(email.html).toContain('https://deadandtattooed.com/unsubscribe?token=tok_123');
	});

	it('handles a trailing slash on baseUrl and missing price/image', () => {
		const email = buildDropEmail(
			{ ...piece, price: null, images: [] },
			{ ...opts, baseUrl: 'https://deadandtattooed.com/' }
		);

		expect(email.text).toContain('https://deadandtattooed.com/products/abc123');
		expect(email.text).not.toContain('Price:');
		expect(email.html).not.toContain('<img');
	});

	it('escapes HTML in piece fields', () => {
		const email = buildDropEmail(
			{ ...piece, title: 'Piggy <5> & "friends"', description: '<b>bold</b>' },
			opts
		);

		expect(email.html).toContain('Piggy &lt;5&gt; &amp; &quot;friends&quot;');
		expect(email.html).not.toContain('<b>bold</b>');
		// Subject/text are plain, no escaping
		expect(email.subject).toBe('New piece: Piggy <5> & "friends"');
	});

	it('trims long descriptions', () => {
		const email = buildDropEmail({ ...piece, description: 'x'.repeat(500) }, opts);

		expect(email.text).toContain('…');
		expect(email.text).not.toContain('x'.repeat(300));
	});
});
