import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = Omit<T, 'children'>;
export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithElementRef<T> = T & { ref?: HTMLDivElement | null };
