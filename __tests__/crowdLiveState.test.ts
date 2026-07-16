import { beforeEach, describe, expect, it } from 'vitest';
import {
  _resetCrowdLiveStateForTests,
  advanceZoneOccupancy,
  peekZoneOccupancy,
  stepOnce,
} from '../lib/crowdLiveState';

beforeEach(() => {
  _resetCrowdLiveStateForTests();
});

describe('stepOnce (pure step logic, injected randomness)', () => {
  it('moves in the current direction when the flip roll does not trigger', () => {
    const result = stepOnce({ occupancyPercent: 50, direction: 1 }, /* flipRoll */ 0.9, /* stepRoll */ 0.5, 0);
    expect(result.occupancyPercent).toBeGreaterThan(50);
    expect(result.direction).toBe(1);
  });

  it('flips direction when the flip roll triggers', () => {
    const result = stepOnce({ occupancyPercent: 50, direction: 1 }, /* flipRoll */ 0.01, 0.5, 0);
    expect(result.direction).toBe(-1);
  });

  it('bounces off the ceiling instead of sticking above it', () => {
    const result = stepOnce({ occupancyPercent: 99, direction: 1 }, 0.9, 0.99, 0);
    expect(result.occupancyPercent).toBe(100);
    expect(result.direction).toBe(-1);
  });

  it('bounces off the floor instead of sticking below it', () => {
    const result = stepOnce({ occupancyPercent: 16, direction: -1 }, 0.9, 0.99, 0);
    expect(result.occupancyPercent).toBe(15);
    expect(result.direction).toBe(1);
  });

  it('never steps by more than the max step size in one tick', () => {
    const result = stepOnce({ occupancyPercent: 50, direction: 1 }, 0.9, 1, 0);
    expect(Math.abs(result.occupancyPercent - 50)).toBeLessThanOrEqual(6);
  });
});

describe('advanceZoneOccupancy', () => {
  it('produces a continuous walk across repeated ticks — no wild jumps', () => {
    let previous = advanceZoneOccupancy('s1', 'z1').occupancyPercent;
    for (let i = 0; i < 20; i += 1) {
      const { occupancyPercent } = advanceZoneOccupancy('s1', 'z1');
      expect(Math.abs(occupancyPercent - previous)).toBeLessThanOrEqual(6);
      previous = occupancyPercent;
    }
  });

  it('keeps occupancy within [15, 100] no matter how many ticks pass', () => {
    for (let i = 0; i < 100; i += 1) {
      const { occupancyPercent } = advanceZoneOccupancy('s1', 'z1');
      expect(occupancyPercent).toBeGreaterThanOrEqual(15);
      expect(occupancyPercent).toBeLessThanOrEqual(100);
    }
  });

  it('tracks separate state per (stadium, zone) key', () => {
    const a1 = advanceZoneOccupancy('stadium-a', 'zone-1');
    const b1 = advanceZoneOccupancy('stadium-b', 'zone-1');
    // Different keys can legitimately start at different random points —
    // the real guarantee is that continuing to advance A never touches B.
    advanceZoneOccupancy('stadium-a', 'zone-1');
    const bAgain = peekZoneOccupancy('stadium-b', 'zone-1');
    expect(bAgain.occupancyPercent).toBe(b1.occupancyPercent);
  });

  it('accumulates a bounded rolling history', () => {
    for (let i = 0; i < 10; i += 1) advanceZoneOccupancy('s1', 'z1');
    const { history } = advanceZoneOccupancy('s1', 'z1');
    expect(history.length).toBeLessThanOrEqual(5);
  });
});

describe('peekZoneOccupancy', () => {
  it('does not change the value on repeated peeks (read-only)', () => {
    const first = peekZoneOccupancy('s1', 'z1');
    const second = peekZoneOccupancy('s1', 'z1');
    const third = peekZoneOccupancy('s1', 'z1');
    expect(second.occupancyPercent).toBe(first.occupancyPercent);
    expect(third.occupancyPercent).toBe(first.occupancyPercent);
  });

  it('agrees with the value an advance would continue from', () => {
    const peeked = peekZoneOccupancy('s1', 'z1');
    const advanced = advanceZoneOccupancy('s1', 'z1');
    // The advance starts from exactly what was peeked — same underlying state.
    expect(Math.abs(advanced.occupancyPercent - peeked.occupancyPercent)).toBeLessThanOrEqual(6);
  });

  it('initializes a never-seen zone within the valid starting range', () => {
    const { occupancyPercent } = peekZoneOccupancy('fresh-stadium', 'fresh-zone');
    expect(occupancyPercent).toBeGreaterThanOrEqual(30);
    expect(occupancyPercent).toBeLessThanOrEqual(70);
  });
});
