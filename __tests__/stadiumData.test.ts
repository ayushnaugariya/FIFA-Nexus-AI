import { describe, expect, it } from 'vitest';
import { DEFAULT_STADIUM, getStadiumById, STADIUMS, summarizeStadiumForPrompt } from '../lib/stadiumData';

describe('STADIUMS', () => {
  it('every stadium has at least one zone with a gate and an accessible route', () => {
    for (const stadium of STADIUMS) {
      expect(stadium.zones.length).toBeGreaterThan(0);
      for (const zone of stadium.zones) {
        expect(zone.gates.length).toBeGreaterThan(0);
        expect(zone.accessibleRoute.length).toBeGreaterThan(0);
      }
    }
  });

  it('every stadium has a unique id', () => {
    const ids = STADIUMS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getStadiumById', () => {
  it('finds a known stadium', () => {
    expect(getStadiumById('metlife-nj')?.name).toBe('MetLife Stadium');
  });

  it('returns undefined for an unknown id', () => {
    expect(getStadiumById('not-a-real-stadium')).toBeUndefined();
  });
});

describe('DEFAULT_STADIUM', () => {
  it('is a valid member of STADIUMS', () => {
    expect(STADIUMS.map((s) => s.id)).toContain(DEFAULT_STADIUM.id);
  });
});

describe('summarizeStadiumForPrompt', () => {
  it('includes the venue name, transit options, and every zone name', () => {
    const stadium = STADIUMS[0]!;
    const summary = summarizeStadiumForPrompt(stadium);
    expect(summary).toContain(stadium.name);
    for (const transitOption of stadium.transitOptions) {
      expect(summary).toContain(transitOption);
    }
    for (const zone of stadium.zones) {
      expect(summary).toContain(zone.name);
    }
  });
});
