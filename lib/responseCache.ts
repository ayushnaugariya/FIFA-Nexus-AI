import { createHash } from 'crypto';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

/**
 * Deterministic cache key from the exact prompt inputs. Same system
 * instruction + same user content + same output cap → same expected
 * answer, so it's safe to reuse. This matters most under real match-day
 * load: hundreds of fans near Gate A independently asking "where's the
 * nearest restroom", or the Command Center polling the same shift-briefing
 * question — each duplicate becomes a cache hit instead of a paid model call.
 */
export function buildCacheKey(parts: { systemInstruction: string; userContent: string; maxOutputTokens: number }): string {
  return createHash('sha256')
    .update(parts.systemInstruction)
    .update('\u0000')
    .update(parts.userContent)
    .update('\u0000')
    .update(String(parts.maxOutputTokens))
    .digest('hex');
}

export function getCached(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key: string, value: string, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  // Opportunistic cleanup so a long-running process doesn't accumulate
  // unbounded stale entries between hits.
  if (store.size > 500) {
    for (const [k, v] of store) {
      if (v.expiresAt <= Date.now()) store.delete(k);
    }
  }
}

export function _clearResponseCacheForTests(): void {
  store.clear();
}
