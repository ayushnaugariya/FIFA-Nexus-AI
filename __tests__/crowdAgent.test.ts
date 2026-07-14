import { describe, expect, it } from 'vitest';
import { buildOccupancyHistory, getCrowdAgentState } from '../lib/agents/crowdAgent';
import { STADIUMS } from '../lib/stadiumData';
import type { ZoneSnapshot } from '../lib/crowdSim';

describe('buildOccupancyHistory', () => {
  it('produces an increasing series for a rising trend', () => {
    const zone: ZoneSnapshot = { zoneId: 'a', zoneName: 'A', occupancyPercent: 70, level: 'high', trend: 'rising' };
    const history = buildOccupancyHistory(zone);
    expect(history[0]).toBeLessThan(history[1] as number);
    expect(history[1]).toBeLessThan(history[2] as number);
  });

  it('produces a decreasing series for a falling trend', () => {
    const zone: ZoneSnapshot = { zoneId: 'a', zoneName: 'A', occupancyPercent: 70, level: 'high', trend: 'falling' };
    const history = buildOccupancyHistory(zone);
    expect(history[0]).toBeGreaterThan(history[1] as number);
  });

  it('produces a flat series for a steady trend', () => {
    const zone: ZoneSnapshot = { zoneId: 'a', zoneName: 'A', occupancyPercent: 55, level: 'moderate', trend: 'steady' };
    expect(buildOccupancyHistory(zone)).toEqual([55, 55, 55]);
  });

  it('clamps a rising series so it never dips below 0', () => {
    const zone: ZoneSnapshot = { zoneId: 'a', zoneName: 'A', occupancyPercent: 5, level: 'low', trend: 'rising' };
    const history = buildOccupancyHistory(zone);
    expect(Math.min(...history)).toBeGreaterThanOrEqual(0);
  });
});

describe('getCrowdAgentState', () => {
  it('returns one forecast per zone, deterministic for a fixed seed', () => {
    const stadium = STADIUMS[0]!;
    const state = getCrowdAgentState(stadium, 123);
    expect(state.forecasts).toHaveLength(stadium.zones.length);
    const again = getCrowdAgentState(stadium, 123);
    expect(state.snapshot.zones).toEqual(again.snapshot.zones);
  });
});
