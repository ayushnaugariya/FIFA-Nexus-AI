import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _clearResponseCacheForTests, buildCacheKey, getCached, setCached } from '../lib/responseCache';

beforeEach(() => {
  _clearResponseCacheForTests();
});

describe('buildCacheKey', () => {
  it('is identical for identical inputs', () => {
    const a = buildCacheKey({ systemInstruction: 'sys', userContent: 'hi', maxOutputTokens: 100 });
    const b = buildCacheKey({ systemInstruction: 'sys', userContent: 'hi', maxOutputTokens: 100 });
    expect(a).toBe(b);
  });

  it('differs when the user content differs', () => {
    const a = buildCacheKey({ systemInstruction: 'sys', userContent: 'hi', maxOutputTokens: 100 });
    const b = buildCacheKey({ systemInstruction: 'sys', userContent: 'bye', maxOutputTokens: 100 });
    expect(a).not.toBe(b);
  });

  it('differs when the system instruction differs (different grounding context)', () => {
    const a = buildCacheKey({ systemInstruction: 'sys A', userContent: 'hi', maxOutputTokens: 100 });
    const b = buildCacheKey({ systemInstruction: 'sys B', userContent: 'hi', maxOutputTokens: 100 });
    expect(a).not.toBe(b);
  });

  it('does not collide across a naive string-concatenation boundary', () => {
    // Without a separator, ("ab","c") and ("a","bc") would hash identically.
    const a = buildCacheKey({ systemInstruction: 'ab', userContent: 'c', maxOutputTokens: 1 });
    const b = buildCacheKey({ systemInstruction: 'a', userContent: 'bc', maxOutputTokens: 1 });
    expect(a).not.toBe(b);
  });
});

describe('getCached / setCached', () => {
  it('returns null for a key that was never set', () => {
    expect(getCached('missing-key')).toBeNull();
  });

  it('returns the stored value before expiry', () => {
    setCached('k', 'hello world', 10_000);
    expect(getCached('k')).toBe('hello world');
  });

  it('expires entries after their TTL', () => {
    vi.useFakeTimers();
    setCached('k', 'value', 1_000);
    vi.advanceTimersByTime(1_001);
    expect(getCached('k')).toBeNull();
    vi.useRealTimers();
  });
});
