/**
 * Tiny fixed-window in-memory rate limiter for public abuse surfaces
 * (e.g. /api/subscribe). Per-instance only: on serverless each warm instance
 * keeps its own counters and a cold start resets them — good enough to blunt
 * dumb loops/bots, NOT a hard global quota. If real abuse shows up, move to a
 * shared store (Upstash/Redis/Postgres).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired buckets so the map can't grow unbounded. */
function sweep(now: number): void {
	if (buckets.size < 10_000) return;
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}

/**
 * Record a hit for `key` and report whether it is still within `max` hits per
 * `windowMs`. Returns true = allowed, false = throttled.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		sweep(now);
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	bucket.count += 1;
	return bucket.count <= max;
}

/** Test hook: clear all counters. */
export function resetRateLimits(): void {
	buckets.clear();
}
