export interface CartItem {
	artworkId: string;
	title: string;
	image: string | null;
	priceCents: number;
}

function isValidCartItem(value: unknown): value is CartItem {
	if (!value || typeof value !== 'object') return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.artworkId === 'string' &&
		item.artworkId.length > 0 &&
		typeof item.title === 'string' &&
		(item.image === null || typeof item.image === 'string') &&
		typeof item.priceCents === 'number'
	);
}

class CartStore {
	private _items = $state<CartItem[]>([]);

	constructor() {
		// Load from localStorage on initialization
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('cart');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					// Validate shape; drop anything from an older cart format
					if (Array.isArray(parsed)) {
						this._items = parsed.filter(isValidCartItem);
					} else {
						console.warn('Invalid cart data in localStorage, resetting');
						this._items = [];
					}
				} catch (e) {
					console.error('Failed to load cart from localStorage:', e);
					this._items = [];
				}
			}
		}
	}

	get items() {
		return this._items;
	}

	get itemCount() {
		// Every piece is one-of-a-kind, so quantity is always 1
		return this._items.length;
	}

	get total() {
		return this._items.reduce((sum, item) => sum + item.priceCents, 0);
	}

	get isEmpty() {
		return this._items.length === 0;
	}

	get artworkIds() {
		return this._items.map((item) => item.artworkId);
	}

	private save() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('cart', JSON.stringify(this._items));
			} catch (e) {
				// Handle quota exceeded or other storage errors
				if (e instanceof DOMException && e.name === 'QuotaExceededError') {
					console.error('Cart storage quota exceeded. Cart may not persist.');
				} else {
					console.error('Failed to save cart to localStorage:', e);
				}
			}
		}
	}

	addItem(item: CartItem) {
		// One-of-a-kind pieces: no duplicates, quantity is always 1
		if (this._items.some((i) => i.artworkId === item.artworkId)) {
			return false;
		}

		this._items.push({ ...item });
		this.save();
		return true;
	}

	removeItem(artworkId: string) {
		this._items = this._items.filter((item) => item.artworkId !== artworkId);
		this.save();
	}

	clear() {
		this._items = [];
		this.save();
	}

	getItem(artworkId: string): CartItem | undefined {
		return this._items.find((i) => i.artworkId === artworkId);
	}
}

// Export a singleton instance
export const cart = new CartStore();
