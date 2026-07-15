import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../lib/env';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('env.geminiApiKey', () => {
  it('throws a clear error when the key is missing, rather than silently returning undefined', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => env.geminiApiKey).toThrow(/GEMINI_API_KEY/);
  });

  it('returns the key when present', () => {
    process.env.GEMINI_API_KEY = 'test-key-123';
    expect(env.geminiApiKey).toBe('test-key-123');
  });

  it('treats a whitespace-only key as missing', () => {
    process.env.GEMINI_API_KEY = '   ';
    expect(() => env.geminiApiKey).toThrow(/GEMINI_API_KEY/);
  });
});

describe('env.geminiModel', () => {
  it('defaults to gemini-1.5-flash when unset', () => {
    delete process.env.GEMINI_MODEL;
    expect(env.geminiModel).toBe('gemini-1.5-flash');
  });

  it('uses the configured model when set', () => {
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    expect(env.geminiModel).toBe('gemini-2.0-flash');
  });
});

describe('env.rateLimitPerMinute', () => {
  it('defaults to 20 when unset or invalid', () => {
    delete process.env.RATE_LIMIT_PER_MINUTE;
    expect(env.rateLimitPerMinute).toBe(20);
    process.env.RATE_LIMIT_PER_MINUTE = 'not-a-number';
    expect(env.rateLimitPerMinute).toBe(20);
    process.env.RATE_LIMIT_PER_MINUTE = '-5';
    expect(env.rateLimitPerMinute).toBe(20);
  });

  it('uses a valid configured value', () => {
    process.env.RATE_LIMIT_PER_MINUTE = '50';
    expect(env.rateLimitPerMinute).toBe(50);
  });
});
