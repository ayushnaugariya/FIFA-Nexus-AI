import { describe, expect, it } from 'vitest';
import { validateImagePayload, VisionInputError } from '../lib/vision';

// Roughly 1KB of base64 — well under any limit, used as a valid baseline.
const SMALL_BASE64 = Buffer.from('a'.repeat(800)).toString('base64');

describe('validateImagePayload', () => {
  it('accepts a small, allowed-type image', () => {
    expect(() => validateImagePayload(SMALL_BASE64, 'image/jpeg')).not.toThrow();
    expect(() => validateImagePayload(SMALL_BASE64, 'image/png')).not.toThrow();
    expect(() => validateImagePayload(SMALL_BASE64, 'image/webp')).not.toThrow();
  });

  it('rejects a disallowed MIME type', () => {
    expect(() => validateImagePayload(SMALL_BASE64, 'image/gif')).toThrow(VisionInputError);
    expect(() => validateImagePayload(SMALL_BASE64, 'application/pdf')).toThrow(VisionInputError);
    expect(() => validateImagePayload(SMALL_BASE64, 'text/html')).toThrow(VisionInputError);
  });

  it('rejects an oversized image (over the 5MB cap)', () => {
    // ~7MB of base64 characters — comfortably over the 5MB decoded limit.
    const huge = 'a'.repeat(7 * 1024 * 1024);
    expect(() => validateImagePayload(huge, 'image/jpeg')).toThrow(VisionInputError);
  });

  it('accepts an image right at the boundary and rejects just over it', () => {
    // 5MB decoded ≈ (5*1024*1024 * 4/3) base64 chars.
    const atLimit = 'a'.repeat(Math.floor((5 * 1024 * 1024 * 4) / 3) - 10);
    const overLimit = 'a'.repeat(Math.floor((5 * 1024 * 1024 * 4) / 3) + 1000);
    expect(() => validateImagePayload(atLimit, 'image/png')).not.toThrow();
    expect(() => validateImagePayload(overLimit, 'image/png')).toThrow(VisionInputError);
  });
});
