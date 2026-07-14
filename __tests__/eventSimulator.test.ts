import { describe, expect, it } from 'vitest';
import { simulateMatchEvent } from '../lib/eventSimulator';
import type { ZoneSnapshot } from '../lib/crowdSim';

const zones: ZoneSnapshot[] = [
  { zoneId: 'north', zoneName: 'North Concourse', occupancyPercent: 60, level: 'moderate', trend: 'steady' },
  { zoneId: 'gate-a', zoneName: 'Gate A', occupancyPercent: 50, level: 'moderate', trend: 'steady' },
];

describe('simulateMatchEvent', () => {
  it('projects a concourse surge for a goal', () => {
    const result = simulateMatchEvent('goal_scored', zones);
    const concourse = result.zoneImpacts.find((z) => z.zoneId === 'north');
    expect(concourse?.projectedOccupancyPercent).toBeGreaterThan(60);
  });

  it('projects the largest exit surge at halftime vs a goal', () => {
    const goal = simulateMatchEvent('goal_scored', zones);
    const halftime = simulateMatchEvent('halftime', zones);
    const goalConcourse = goal.zoneImpacts.find((z) => z.zoneId === 'north')!;
    const halftimeConcourse = halftime.zoneImpacts.find((z) => z.zoneId === 'north')!;
    expect(halftimeConcourse.projectedOccupancyPercent).toBeGreaterThanOrEqual(goalConcourse.projectedOccupancyPercent);
  });

  it('recommends transport notification and exit lanes at final whistle', () => {
    const result = simulateMatchEvent('final_whistle', zones);
    expect(result.recommendedActions.some((a) => a.toLowerCase().includes('transport'))).toBe(true);
    expect(result.recommendedActions.some((a) => a.toLowerCase().includes('exit'))).toBe(true);
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
