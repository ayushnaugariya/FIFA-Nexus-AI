import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from '../lib/csp';

describe('buildContentSecurityPolicy', () => {
  const csp = buildContentSecurityPolicy();

  it('defaults every directive to same-origin only', () => {
    expect(csp).toContain("default-src 'self'");
  });

  it('blocks framing entirely (clickjacking mitigation)', () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('restricts form submissions to same-origin', () => {
    expect(csp).toContain("form-action 'self'");
  });

  it('restricts the base URI to prevent base-tag injection attacks', () => {
    expect(csp).toContain("base-uri 'self'");
  });

  it('does not allow any third-party script or connect origins', () => {
    expect(csp).not.toMatch(/script-src[^;]*https?:/);
    expect(csp).not.toMatch(/connect-src[^;]*https?:/);
  });

  it('is a stable, deterministic string (no per-request randomness)', () => {
    expect(buildContentSecurityPolicy()).toBe(csp);
  });
});
