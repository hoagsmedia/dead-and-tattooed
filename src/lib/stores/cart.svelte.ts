export interface CartItem {
	productId: string;
	priceId: string;
	name: string;
	image: string | null;
	price: number;
	currency: string;
	quantity: number;
	recurring: {
		interval: string;
		interval_count: number;
	} | null;
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
					// Validate that parsed data is an array
					if (Array.isArray(parsed)) {
						this._items = parsed;
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
		// Since all products are one-of-a-kind, quantity is always 1
		// So itemCount is just the number of items
		return this._items.length;
	}

	get total() {
		// Since quantity is always 1, we can simplify this
		return this._items.reduce((sum, item) => sum + item.price, 0);
	}

	get isEmpty() {
		return this._items.length === 0;
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

	addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
		// Check if product is already in cart (one-of-a-kind products)
		const existingIndex = this._items.findIndex(
			(i) => i.productId === item.productId
		);

		if (existingIndex >= 0) {
			// Product already in cart - don't allow duplicates
			return false;
		}

		// Add new item with quantity always set to 1
		this._items.push({
			...item,
			quantity: 1
		});

		this.save();
		return true;
	}

	removeItem(productId: string, priceId?: string) {
		// Remove by productId (one-of-a-kind, so only one instance per product)
		this._items = this._items.filter(
			(item) => item.productId !== productId
		);
		this.save();
	}

	// Note: updateQuantity is kept for backwards compatibility but doesn't do anything
	// since products are one-of-a-kind and quantity is always 1
	updateQuantity(productId: string, _priceId: string, quantity: number) {
		// If quantity is 0 or less, remove the item
		if (quantity <= 0) {
			this.removeItem(productId);
		}
		// Otherwise, do nothing since quantity must always be 1
	}

	clear() {
		this._items = [];
		this.save();
	}

	getItem(productId: string, priceId?: string): CartItem | undefined {
		// Since products are one-of-a-kind, we only need to check productId
		return this._items.find((i) => i.productId === productId);
	}
}

// Export a singleton instance
export const cart = new CartStore();

