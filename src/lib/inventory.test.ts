import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq, like } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { artwork, user } from '../db/schema.js';
import {
	ArtworkUnavailableError,
	RESERVATION_MINUTES,
	dollarsToCents,
	markArtworksSold,
	releaseExpiredReservations,
	releaseReservations,
	reserveArtworks
} from './inventory.js';

const connectionString =
	process.env.DATABASE_URL ?? 'postgresql://frugr:frugr@localhost:5432/dnt_dev_a';

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool, { schema });

const TEST_PREFIX = 'inv-test-';
const TEST_USER_ID = `${TEST_PREFIX}user`;

let seq = 0;

async function createArtwork(
	overrides: Partial<typeof artwork.$inferInsert> = {}
): Promise<string> {
	const id = `${TEST_PREFIX}${Date.now()}-${seq++}`;
	await db.insert(artwork).values({
		id,
		title: `Test Piece ${id}`,
		price: '120.00',
		images: [],
		published: true,
		userId: TEST_USER_ID,
		...overrides
	});
	return id;
}

async function getArtwork(id: string) {
	const [row] = await db.select().from(artwork).where(eq(artwork.id, id)).limit(1);
	return row;
}

beforeAll(async () => {
	await db
		.insert(user)
		.values({
			id: TEST_USER_ID,
			name: 'Inventory Test User',
			email: `${TEST_USER_ID}@example.com`,
			emailVerified: true,
			updatedAt: new Date()
		})
		.onConflictDoNothing();
});

afterEach(async () => {
	await db.delete(artwork).where(like(artwork.id, `${TEST_PREFIX}%`));
});

afterAll(async () => {
	await db.delete(user).where(eq(user.id, TEST_USER_ID));
	await pool.end();
});

describe('reserveArtworks', () => {
	it('reserves an available published piece for the reservation window', async () => {
		const id = await createArtwork();

		const reserved = await reserveArtworks(db, [id]);

		expect(reserved).toEqual([id]);
		const row = await getArtwork(id);
		expect(row.status).toBe('reserved');
		expect(row.reservedUntil).not.toBeNull();
		const remainingMs = row.reservedUntil!.getTime() - Date.now();
		expect(remainingMs).toBeGreaterThan((RESERVATION_MINUTES - 2) * 60 * 1000);
		expect(remainingMs).toBeLessThanOrEqual(RESERVATION_MINUTES * 60 * 1000 + 60 * 1000);
	});

	it('only lets one of two concurrent checkouts reserve a piece', async () => {
		const id = await createArtwork();

		const results = await Promise.allSettled([
			reserveArtworks(db, [id]),
			reserveArtworks(db, [id])
		]);

		const fulfilled = results.filter((r) => r.status === 'fulfilled');
		const rejected = results.filter((r) => r.status === 'rejected');
		expect(fulfilled).toHaveLength(1);
		expect(rejected).toHaveLength(1);
		expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ArtworkUnavailableError);

		const row = await getArtwork(id);
		expect(row.status).toBe('reserved');
	});

	it('re-reserves a piece whose previous reservation expired', async () => {
		const id = await createArtwork({
			status: 'reserved',
			reservedUntil: new Date(Date.now() - 60 * 1000)
		});

		const reserved = await reserveArtworks(db, [id]);

		expect(reserved).toEqual([id]);
		const row = await getArtwork(id);
		expect(row.status).toBe('reserved');
		expect(row.reservedUntil!.getTime()).toBeGreaterThan(Date.now());
	});

	it('refuses sold pieces and rolls back any pieces reserved in the same attempt', async () => {
		const availableId = await createArtwork();
		const soldId = await createArtwork({ status: 'sold' });

		await expect(reserveArtworks(db, [availableId, soldId])).rejects.toThrow(
			ArtworkUnavailableError
		);

		// The available piece must not stay reserved after the failed attempt
		const row = await getArtwork(availableId);
		expect(row.status).toBe('available');
		expect(row.reservedUntil).toBeNull();
	});

	it('refuses unpublished pieces', async () => {
		const id = await createArtwork({ published: false });

		await expect(reserveArtworks(db, [id])).rejects.toThrow(ArtworkUnavailableError);
	});

	it('reports which piece was unavailable', async () => {
		const soldId = await createArtwork({ status: 'sold', title: 'Piggy No. 5' });

		const err = await reserveArtworks(db, [soldId]).catch((e) => e);

		expect(err).toBeInstanceOf(ArtworkUnavailableError);
		expect(err.unavailable).toEqual([{ id: soldId, title: 'Piggy No. 5', status: 'sold' }]);
		expect(err.message).toContain('Piggy No. 5');
	});
});

describe('releaseExpiredReservations', () => {
	it('releases reservations past their window', async () => {
		const expiredId = await createArtwork({
			status: 'reserved',
			reservedUntil: new Date(Date.now() - 60 * 1000)
		});
		const activeId = await createArtwork({
			status: 'reserved',
			reservedUntil: new Date(Date.now() + 10 * 60 * 1000)
		});

		await releaseExpiredReservations(db);

		expect((await getArtwork(expiredId)).status).toBe('available');
		expect((await getArtwork(expiredId)).reservedUntil).toBeNull();
		expect((await getArtwork(activeId)).status).toBe('reserved');
	});

	it('never touches sold pieces', async () => {
		const soldId = await createArtwork({ status: 'sold' });

		await releaseExpiredReservations(db);

		expect((await getArtwork(soldId)).status).toBe('sold');
	});
});

describe('releaseReservations', () => {
	it('releases reserved pieces but leaves sold pieces sold', async () => {
		const reservedId = await createArtwork({
			status: 'reserved',
			reservedUntil: new Date(Date.now() + 10 * 60 * 1000)
		});
		const soldId = await createArtwork({ status: 'sold' });

		await releaseReservations(db, [reservedId, soldId]);

		expect((await getArtwork(reservedId)).status).toBe('available');
		expect((await getArtwork(soldId)).status).toBe('sold');
	});
});

describe('markArtworksSold', () => {
	it('marks pieces sold and keeps them published', async () => {
		const id = await createArtwork({
			status: 'reserved',
			reservedUntil: new Date(Date.now() + 10 * 60 * 1000)
		});

		await markArtworksSold(db, [id]);

		const row = await getArtwork(id);
		expect(row.status).toBe('sold');
		expect(row.reservedUntil).toBeNull();
		expect(row.published).toBe(true);
	});

	it('sold stays sold: cannot be reserved and is untouched by releases', async () => {
		const id = await createArtwork();
		await markArtworksSold(db, [id]);

		await expect(reserveArtworks(db, [id])).rejects.toThrow(ArtworkUnavailableError);
		await releaseExpiredReservations(db);
		await releaseReservations(db, [id]);

		expect((await getArtwork(id)).status).toBe('sold');
	});
});

describe('dollarsToCents', () => {
	it('converts a numeric string to integer cents', () => {
		expect(dollarsToCents('120.00')).toBe(12000);
		expect(dollarsToCents('99.99')).toBe(9999);
		expect(dollarsToCents('0.10')).toBe(10);
	});

	it('returns null for missing or invalid prices', () => {
		expect(dollarsToCents(null)).toBeNull();
		expect(dollarsToCents('')).toBeNull();
		expect(dollarsToCents('not-a-price')).toBeNull();
	});
});
