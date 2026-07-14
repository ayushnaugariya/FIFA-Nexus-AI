import { describe, expect, it } from 'vitest';
import { classifyUtilityStatus, simulateUtilityReading } from '../lib/utilities';

describe('simulateUtilityReading', () => {
  it('is deterministic for a fixed seed', () => {
    const a = simulateUtilityReading(3000, 99);
    const b = simulateUtilityReading(3000, 99);
    expect(a).toEqual(b);
  });

  it('scales power draw with the base load', () => {
    const small = simulateUtilityReading(1000, 5);
    const large = simulateUtilityReading(5000, 5);
    expect(large.powerKw).toBeGreaterThan(small.powerKw);
  });
});

describe('classifyUtilityStatus', () => {
  it('flags action-needed when waste capacity is near full', () => {
    const status = classifyUtilityStatus({ powerKw: 1000, waterLitersPerMin: 100, wastePercentFull: 90 }, 3000);
    expect(status).toBe('action-needed');
  });

  it('flags action-needed when power draw exceeds baseline by 10%+', () => {
    const status = classifyUtilityStatus({ powerKw: 3400, waterLitersPerMin: 100, wastePercentFull: 10 }, 3000);
    expect(status).toBe('action-needed');
  });

  it('flags elevated for moderate waste levels', () => {
    const status = classifyUtilityStatus({ powerKw: 1000, waterLitersPerMin: 100, wastePercentFull: 70 }, 3000);
    expect(status).toBe('elevated');
  });

  it('reports normal when everything is comfortably within range', () => {
    const status = classifyUtilityStatus({ powerKw: 1000, waterLitersPerMin: 100, wastePercentFull: 20 }, 3000);
    expect(status).toBe('normal');
  });
});
