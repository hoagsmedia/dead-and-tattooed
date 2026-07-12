import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimit, resetRateLimits } from './rate-limit.js';

describe('rateLimit', () => {
	beforeEach(() => {
		resetRateLimits();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('allows up to max hits within the window', () => {
		for (let i = 0; i < 5; i++) {
			expect(rateLimit('ip:1', 5, 60_000)).toBe(true);
		}
	});

	it('throttles the hit after max within the window', () => {
		for (let i = 0; i < 5; i++) rateLimit('ip:1', 5, 60_000);
		expect(rateLimit('ip:1', 5, 60_000)).toBe(false);
		expect(rateLimit('ip:1', 5, 60_000)).toBe(false);
	});

	it('tracks keys independently', () => {
		for (let i = 0; i < 5; i++) rateLimit('ip:1', 5, 60_000);
		expect(rateLimit('ip:1', 5, 60_000)).toBe(false);
		expect(rateLimit('ip:2', 5, 60_000)).toBe(true);
	});

	it('resets after the window passes', () => {
		for (let i = 0; i < 6; i++) rateLimit('ip:1', 5, 60_000);
		expect(rateLimit('ip:1', 5, 60_000)).toBe(false);
		vi.advanceTimersByTime(60_001);
		expect(rateLimit('ip:1', 5, 60_000)).toBe(true);
	});
});
