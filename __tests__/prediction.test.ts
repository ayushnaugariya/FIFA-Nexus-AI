import { describe, expect, it } from 'vitest';
import { forecastOccupancy, willCrossCritical } from '../lib/prediction';

describe('forecastOccupancy', () => {
  it('projects a flat line when there is no trend', () => {
    const forecast = forecastOccupancy([50, 50, 50], 5);
    for (const point of forecast) {
      expect(point.projectedOccupancyPercent).toBeCloseTo(50, 0);
    }
  });

  it('projects upward when occupancy is rising', () => {
    const forecast = forecastOccupancy([40, 50, 60], 5, [15]);
    expect(forecast[0]?.projectedOccupancyPercent).toBeGreaterThan(60);
  });

  it('projects downward when occupancy is falling', () => {
    const forecast = forecastOccupancy([80, 70, 60], 5, [15]);
    expect(forecast[0]?.projectedOccupancyPercent).toBeLessThan(60);
  });

  it('clamps projections to [0, 100]', () => {
    const forecast = forecastOccupancy([10, 40, 70], 5, [120]);
    expect(forecast[0]?.projectedOccupancyPercent).toBeLessThanOrEqual(100);
    expect(forecast[0]?.projectedOccupancyPercent).toBeGreaterThanOrEqual(0);
  });

  it('handles a single reading by assuming no trend', () => {
    const forecast = forecastOccupancy([65], 5, [30]);
    expect(forecast[0]?.projectedOccupancyPercent).toBeCloseTo(65, 0);
  });

  it('throws on empty history', () => {
    expect(() => forecastOccupancy([], 5)).toThrow(RangeError);
  });

  it('throws on a non-positive sample interval', () => {
    expect(() => forecastOccupancy([50], 0)).toThrow(RangeError);
  });
});

describe('willCrossCritical', () => {
  it('returns the first point at or above the critical threshold', () => {
    const forecast = [
      { minutesFromNow: 15, projectedOccupancyPercent: 70 },
      { minutesFromNow: 30, projectedOccupancyPercent: 96 },
      { minutesFromNow: 60, projectedOccupancyPercent: 99 },
    ];
    expect(willCrossCritical(forecast)?.minutesFromNow).toBe(30);
  });

  it('returns null when no point crosses the threshold', () => {
    const forecast = [
      { minutesFromNow: 15, projectedOccupancyPercent: 40 },
      { minutesFromNow: 30, projectedOccupancyPercent: 50 },
    ];
    expect(willCrossCritical(forecast)).toBeNull();
  });

  it('respects a custom threshold', () => {
    const forecast = [{ minutesFromNow: 15, projectedOccupancyPercent: 82 }];
    expect(willCrossCritical(forecast, 80)?.minutesFromNow).toBe(15);
    expect(willCrossCritical(forecast, 95)).toBeNull();
  });
});
