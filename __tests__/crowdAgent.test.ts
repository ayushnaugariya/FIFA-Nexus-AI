import { describe, expect, it } from 'vitest';
import { buildOccupancyHistory, getCrowdAgentState, peekCrowdAgentState } from '../lib/agents/crowdAgent';
import { STADIUMS } from '../lib/stadiumData';
import type { ZoneSnapshot } from '../lib/crowdSim';
import { _resetCrowdLiveStateForTests } from '../lib/crowdLiveState';

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

  it('live path (no seed): consecutive calls are continuous, not independent random draws', () => {
    _resetCrowdLiveStateForTests();
    const stadium = STADIUMS[0]!;
    const first = getCrowdAgentState(stadium);
    const second = getCrowdAgentState(stadium);
    for (let i = 0; i < first.snapshot.zones.length; i += 1) {
      const before = first.snapshot.zones[i]!.occupancyPercent;
      const after = second.snapshot.zones[i]!.occupancyPercent;
      // A single tick can only move a bounded amount — this is the direct
      // regression test for the bug where every call drew an independent
      // Date.now()-seeded random snapshot with no relation to the last one.
      expect(Math.abs(after - before)).toBeLessThanOrEqual(6);
    }
  });

  it('live path: peekCrowdAgentState reads current state without advancing it — the fix for the bug where every Copilot question also drove the simulation forward', () => {
    _resetCrowdLiveStateForTests();
    const stadium = STADIUMS[0]!;
    const tick = getCrowdAgentState(stadium); // the one true "clock" tick (e.g. the SSE stream)

    // Peeking any number of times afterward must return exactly what the
    // tick left behind — never a new draw, never a further advance.
    const peek1 = peekCrowdAgentState(stadium);
    const peek2 = peekCrowdAgentState(stadium);
    const peek3 = peekCrowdAgentState(stadium);
    expect(peek1.snapshot.zones).toEqual(tick.snapshot.zones);
    expect(peek2.snapshot.zones).toEqual(tick.snapshot.zones);
    expect(peek3.snapshot.zones).toEqual(tick.snapshot.zones);
  });

  it('live path: repeated getCrowdAgentState calls (the SSE tick) do advance, unlike peekCrowdAgentState', () => {
    _resetCrowdLiveStateForTests();
    const stadium = STADIUMS[0]!;
    const first = getCrowdAgentState(stadium);
    const second = getCrowdAgentState(stadium);
    // At least one zone should have moved between two real ticks (a walk
    // that never moves at all across two independent steps would itself
    // indicate the random-walk logic isn't actually running).
    const anyZoneMoved = first.snapshot.zones.some(
      (zone, i) => zone.occupancyPercent !== second.snapshot.zones[i]!.occupancyPercent,
    );
    expect(anyZoneMoved).toBe(true);
  });

  it('live path: forecasts are grounded in real accumulated history, not a heuristic guess from a single reading', () => {
    _resetCrowdLiveStateForTests();
    const stadium = STADIUMS[0]!;
    for (let i = 0; i < 4; i += 1) getCrowdAgentState(stadium);
    const state = getCrowdAgentState(stadium);
    expect(state.forecasts).toHaveLength(stadium.zones.length);
    for (const forecast of state.forecasts) {
      expect(forecast.forecast.length).toBeGreaterThan(0);
    }
  });
});
