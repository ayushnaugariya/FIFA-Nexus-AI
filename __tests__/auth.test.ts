import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isOperatorRequestAuthorized } from '../lib/auth';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('isOperatorRequestAuthorized', () => {
  it('authorizes every request when no operator key is configured (default)', () => {
    delete process.env.OPERATOR_API_KEY;
    expect(isOperatorRequestAuthorized(new Headers())).toBe(true);
    expect(isOperatorRequestAuthorized(new Headers({ authorization: 'garbage' }))).toBe(true);
  });

  it('rejects a request with no Authorization header once a key is configured', () => {
    process.env.OPERATOR_API_KEY = 'secret-123';
    expect(isOperatorRequestAuthorized(new Headers())).toBe(false);
  });

  it('rejects a mismatched key', () => {
    process.env.OPERATOR_API_KEY = 'secret-123';
    expect(isOperatorRequestAuthorized(new Headers({ authorization: 'Bearer wrong-key' }))).toBe(false);
  });

  it('rejects the right key with the wrong scheme', () => {
    process.env.OPERATOR_API_KEY = 'secret-123';
    expect(isOperatorRequestAuthorized(new Headers({ authorization: 'Basic secret-123' }))).toBe(false);
  });

  it('authorizes a correctly formed matching Bearer token', () => {
    process.env.OPERATOR_API_KEY = 'secret-123';
    expect(isOperatorRequestAuthorized(new Headers({ authorization: 'Bearer secret-123' }))).toBe(true);
  });
});
