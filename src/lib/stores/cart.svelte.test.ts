import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CartItem } from './cart.svelte.js';

function createLocalStorageMock() {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, String(value));
		},
		removeItem: (key: string) => {
			store.delete(key);
		},
		clear: () => {
			store.clear();
		}
	};
}

let localStorageMock: ReturnType<typeof createLocalStorageMock>;

async function importCart() {
	const mod = await import('./cart.svelte.js');
	return mod.cart;
}

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
	return {
		artworkId: 'art-1',
		title: 'Piggy No. 1',
		image: 'https://example.com/piggy.jpg',
		priceCents: 12000,
		...overrides
	};
}

beforeEach(() => {
	vi.resetModules();
	localStorageMock = createLocalStorageMock();
	vi.stubGlobal('localStorage', localStorageMock);
	vi.stubGlobal('window', { localStorage: localStorageMock });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('cart store', () => {
	it('adds one-of-a-kind items and rejects duplicates', async () => {
		const cart = await importCart();

		expect(cart.addItem(makeItem())).toBe(true);
		expect(cart.addItem(makeItem())).toBe(false);

		expect(cart.itemCount).toBe(1);
		expect(cart.items[0]).toEqual(makeItem());
	});

	it('computes total in cents and exposes artwork ids', async () => {
		const cart = await importCart();

		cart.addItem(makeItem());
		cart.addItem(makeItem({ artworkId: 'art-2', title: 'Piggy No. 2', priceCents: 9999 }));

		expect(cart.total).toBe(22000 - 1);
		expect(cart.artworkIds).toEqual(['art-1', 'art-2']);
	});

	it('removes items and clears the cart', async () => {
		const cart = await importCart();

		cart.addItem(makeItem());
		cart.addItem(makeItem({ artworkId: 'art-2' }));

		cart.removeItem('art-1');
		expect(cart.getItem('art-1')).toBeUndefined();
		expect(cart.itemCount).toBe(1);

		cart.clear();
		expect(cart.isEmpty).toBe(true);
	});

	it('persists to localStorage and restores on a fresh import', async () => {
		const cart = await importCart();
		cart.addItem(makeItem());
		cart.addItem(makeItem({ artworkId: 'art-2', title: 'Piggy No. 2', priceCents: 4500 }));

		// Simulate a fresh page load sharing the same localStorage
		vi.resetModules();
		const restored = await importCart();

		expect(restored.itemCount).toBe(2);
		expect(restored.getItem('art-2')?.priceCents).toBe(4500);
	});

	it('persists removals', async () => {
		const cart = await importCart();
		cart.addItem(makeItem());
		cart.addItem(makeItem({ artworkId: 'art-2' }));
		cart.removeItem('art-1');

		vi.resetModules();
		const restored = await importCart();

		expect(restored.artworkIds).toEqual(['art-2']);
	});

	it('drops items stored in an older cart format', async () => {
		localStorageMock.setItem(
			'cart',
			JSON.stringify([
				{ productId: 'prod_123', priceId: 'price_123', name: 'Old Item', price: 100, quantity: 1 },
				makeItem()
			])
		);

		const cart = await importCart();

		expect(cart.itemCount).toBe(1);
		expect(cart.items[0].artworkId).toBe('art-1');
	});

	it('resets when localStorage contains invalid JSON', async () => {
		localStorageMock.setItem('cart', 'not-json');

		const cart = await importCart();

		expect(cart.isEmpty).toBe(true);
	});
});
