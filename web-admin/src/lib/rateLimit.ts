// src/lib/rateLimit.ts
// Simple in-memory sliding-window rate limiter.
// Works in the Next.js Node.js runtime (Route Handlers).
// For multi-instance deployments replace the Map with Redis / Upstash.

interface Window {
  count: number;
  resetAt: number; // Unix ms
}

const store = new Map<string, Window>();

interface RateLimitOptions {
  /** Maximum requests allowed within `windowMs`. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check (and increment) a rate-limit bucket identified by `key`.
 * Typical key: `"login:<ip>"` or `"register:<ip>"`.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  // Expire stale windows
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count += 1;
  store.set(key, entry);

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed, remaining, resetAt: entry.resetAt };
}

// Periodically evict expired entries so the Map doesn't grow unbounded.
// Runs every 5 minutes; safe to call in module scope (runs in the worker process).
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);
