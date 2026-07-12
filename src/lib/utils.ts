import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | null, currency: string): string {
	if (!amount) return 'Price not available';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase()
	}).format(amount / 100);
}

export type WithoutChild<T> = Omit<T, 'children'>;
export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;
export type WithElementRef<T, U extends HTMLElement = HTMLDivElement> = T & { ref?: U | null };
