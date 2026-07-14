import { beforeEach, describe, expect, it } from 'vitest';
import { _resetRateLimiterForTests, checkRateLimit, clientKeyFromHeaders } from '../lib/rateLimiter';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimiterForTests();
  });

  it('allows requests up to the limit', () => {
    const key = 'test-client';
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit(key, 5).allowed).toBe(true);
    }
  });

  it('blocks the request after the limit is reached', () => {
    const key = 'test-client-2';
    for (let i = 0; i < 3; i += 1) checkRateLimit(key, 3);
    const result = checkRateLimit(key, 3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks separate clients independently', () => {
    checkRateLimit('client-a', 1);
    const resultB = checkRateLimit('client-b', 1);
    expect(resultB.allowed).toBe(true);
  });
});

describe('clientKeyFromHeaders', () => {
  it('uses the first entry of x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(clientKeyFromHeaders(headers)).toBe('203.0.113.5');
  });

  it('falls back to a shared bucket when the header is absent', () => {
    const headers = new Headers();
    expect(clientKeyFromHeaders(headers)).toBe('unknown-client');
  });
});
