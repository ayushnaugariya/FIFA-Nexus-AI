import { describe, expect, it } from 'vitest';
import { classifyCrowdLevel, generateCrowdSnapshot, recommendActions } from '../lib/crowdSim';
import { STADIUMS } from '../lib/stadiumData';

describe('classifyCrowdLevel', () => {
  it.each([
    [10, 'low'],
    [49, 'low'],
    [50, 'moderate'],
    [79, 'moderate'],
    [80, 'high'],
    [94, 'high'],
    [95, 'critical'],
    [100, 'critical'],
  ])('classifies %i%% occupancy as %s', (occupancy, expected) => {
    expect(classifyCrowdLevel(occupancy)).toBe(expected);
  });
});

describe('generateCrowdSnapshot', () => {
  it('is deterministic for a fixed seed', () => {
    const stadium = STADIUMS[0];
    const a = generateCrowdSnapshot(stadium, 42);
    const b = generateCrowdSnapshot(stadium, 42);
    expect(a.zones.map((z) => z.occupancyPercent)).toEqual(b.zones.map((z) => z.occupancyPercent));
  });

  it('produces one entry per stadium zone', () => {
    const stadium = STADIUMS[1];
    const snapshot = generateCrowdSnapshot(stadium, 7);
    expect(snapshot.zones).toHaveLength(stadium.zones.length);
  });
});

describe('recommendActions', () => {
  it('recommends redirecting fans away from a critical zone', () => {
    const stadium = STADIUMS[0];
    const snapshot = {
      stadiumId: stadium.id,
      generatedAt: new Date().toISOString(),
      zones: [
        { zoneId: stadium.zones[0].id, zoneName: stadium.zones[0].name, occupancyPercent: 98, level: 'critical' as const, trend: 'rising' as const },
        { zoneId: stadium.zones[1].id, zoneName: stadium.zones[1].name, occupancyPercent: 40, level: 'low' as const, trend: 'steady' as const },
      ],
    };
    const recs = recommendActions(snapshot, stadium);
    expect(recs).toHaveLength(1);
    expect(recs[0].level).toBe('critical');
    expect(recs[0].action).toContain(stadium.zones[1].name);
  });

  it('produces no recommendations when every zone is calm', () => {
    const stadium = STADIUMS[2];
    const snapshot = {
      stadiumId: stadium.id,
      generatedAt: new Date().toISOString(),
      zones: stadium.zones.map((z) => ({
        zoneId: z.id,
        zoneName: z.name,
        occupancyPercent: 30,
        level: 'low' as const,
        trend: 'steady' as const,
      })),
    };
    expect(recommendActions(snapshot, stadium)).toHaveLength(0);
  });
});
