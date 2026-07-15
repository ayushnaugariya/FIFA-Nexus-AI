import { describe, expect, it } from 'vitest';
import { getVenueUtilityState } from '../lib/agents/sustainabilityAgent';

describe('getVenueUtilityState', () => {
  it('is deterministic for a fixed seed', () => {
    const a = getVenueUtilityState('metlife-nj', 10);
    const b = getVenueUtilityState('metlife-nj', 10);
    expect(a).toEqual(b);
  });

  it('produces a valid reading and status for a known stadium', () => {
    const state = getVenueUtilityState('bcplace-ca', 5);
    expect(state.reading.powerKw).toBeGreaterThan(0);
    expect(['normal', 'elevated', 'action-needed']).toContain(state.status);
  });

  it('falls back to a sane default base load for an unrecognized stadium id', () => {
    const state = getVenueUtilityState('unknown-stadium', 5);
    expect(state.reading.powerKw).toBeGreaterThan(0);
  });
});
