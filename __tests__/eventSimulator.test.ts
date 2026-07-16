import { describe, expect, it } from 'vitest';
import { simulateMatchEvent } from '../lib/eventSimulator';
import type { ZoneSnapshot } from '../lib/crowdSim';

const zones: ZoneSnapshot[] = [
  { zoneId: 'north', zoneName: 'North Concourse', occupancyPercent: 60, level: 'moderate', trend: 'steady' },
  { zoneId: 'south', zoneName: 'South Concourse', occupancyPercent: 50, level: 'moderate', trend: 'steady' },
];

describe('simulateMatchEvent', () => {
  it('projects a surge for every zone on a goal', () => {
    const result = simulateMatchEvent('goal_scored', zones);
    for (const impact of result.zoneImpacts) {
      const original = zones.find((z) => z.zoneId === impact.zoneId)!;
      expect(impact.projectedOccupancyPercent).toBeGreaterThan(original.occupancyPercent);
    }
  });

  it('applies the multiplier uniformly across every zone (real venue zones are mixed-use, not exit-only or concourse-only)', () => {
    const result = simulateMatchEvent('halftime', zones);
    const north = result.zoneImpacts.find((z) => z.zoneId === 'north')!;
    const south = result.zoneImpacts.find((z) => z.zoneId === 'south')!;
    // Same multiplier applied to different starting occupancies still preserves their ratio.
    expect(north.projectedOccupancyPercent / south.projectedOccupancyPercent).toBeCloseTo(60 / 50, 1);
  });

  it('produces a larger surge at halftime than for a single goal (event-type differentiation, the part that is real and meaningful)', () => {
    const goal = simulateMatchEvent('goal_scored', zones);
    const halftime = simulateMatchEvent('halftime', zones);
    const goalZone = goal.zoneImpacts.find((z) => z.zoneId === 'north')!;
    const halftimeZone = halftime.zoneImpacts.find((z) => z.zoneId === 'north')!;
    expect(halftimeZone.projectedOccupancyPercent).toBeGreaterThan(goalZone.projectedOccupancyPercent);
  });

  it('produces the largest surge of all at the final whistle', () => {
    const halftime = simulateMatchEvent('halftime', zones);
    const finalWhistle = simulateMatchEvent('final_whistle', zones);
    const halftimeZone = halftime.zoneImpacts.find((z) => z.zoneId === 'north')!;
    const finalZone = finalWhistle.zoneImpacts.find((z) => z.zoneId === 'north')!;
    expect(finalZone.projectedOccupancyPercent).toBeGreaterThan(halftimeZone.projectedOccupancyPercent);
  });

  it('recommends transport notification and exit lanes at final whistle', () => {
    const result = simulateMatchEvent('final_whistle', zones);
    expect(result.recommendedActions.some((a) => a.toLowerCase().includes('transport'))).toBe(true);
    expect(result.recommendedActions.some((a) => a.toLowerCase().includes('exit'))).toBe(true);
  });

  it('every zone gets a real, non-empty reason string', () => {
    const result = simulateMatchEvent('goal_scored', zones);
    for (const impact of result.zoneImpacts) {
      expect(impact.reason.length).toBeGreaterThan(0);
    }
  });

  it('never projects occupancy above 100', () => {
    const packedZones: ZoneSnapshot[] = [
      { zoneId: 'north', zoneName: 'North Concourse', occupancyPercent: 95, level: 'critical', trend: 'rising' },
    ];
    const result = simulateMatchEvent('halftime', packedZones);
    expect(result.zoneImpacts[0]?.projectedOccupancyPercent).toBeLessThanOrEqual(100);
  });

  it('reports no action needed when nothing crosses the risk threshold', () => {
    const calmZones: ZoneSnapshot[] = [
      { zoneId: 'north', zoneName: 'North Concourse', occupancyPercent: 10, level: 'low', trend: 'steady' },
    ];
    const result = simulateMatchEvent('goal_scored', calmZones);
    expect(result.recommendedActions).toEqual(['No additional action needed — projected impact is within normal operating range.']);
  });
});
