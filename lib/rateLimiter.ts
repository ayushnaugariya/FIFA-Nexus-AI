/**
 * In-memory, per-key fixed-window rate limiter.
 *
 * This is intentionally simple and dependency-free so the reference build
 * runs with zero external infrastructure. It is documented here as a known
 * limitation: in a multi-instance production deployment this state must
 * move to a shared store (e.g. Redis) so limits apply across instances.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limitPerMinute: number): RateLimitResult {
  const now = Date.now();
  const windowMs = 60_000;
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    windows.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limitPerMinute - 1, resetAt };
  }

  if (existing.count >= limitPerMinute) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limitPerMinute - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Exposed for tests so they can start from a clean slate. */
export function _resetRateLimiterForTests(): void {
  windows.clear();
}

export function clientKeyFromHeaders(headers: Headers): string {
  // Behind most hosting providers (Vercel, nginx, etc.) the real client IP
  // arrives via x-forwarded-for. Falls back to a shared bucket if absent,
  // which just means the fallback is more conservative, never less.
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown-client';
}
