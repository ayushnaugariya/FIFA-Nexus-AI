import { describe, expect, it } from 'vitest';
import { redact } from '../lib/logger';

describe('redact', () => {
  it('redacts common sensitive key names regardless of case', () => {
    const result = redact({ apiKey: 'sk-abc123', Token: 'xyz', AUTHORIZATION: 'Bearer xyz' });
    expect(result.apiKey).toBe('[redacted]');
    expect(result.Token).toBe('[redacted]');
    expect(result.AUTHORIZATION).toBe('[redacted]');
  });

  it('leaves non-sensitive fields untouched', () => {
    const result = redact({ event: 'concierge_failed', stadiumId: 'metlife-nj', attempt: 2 });
    expect(result).toEqual({ event: 'concierge_failed', stadiumId: 'metlife-nj', attempt: 2 });
  });

  it('redacts password fields', () => {
    expect(redact({ password: 'hunter2' }).password).toBe('[redacted]');
  });

  it('handles an empty object', () => {
    expect(redact({})).toEqual({});
  });
});
