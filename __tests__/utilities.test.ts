import { describe, expect, it, beforeEach } from 'vitest';
import { classifyUtilityStatus, simulateUtilityReading, advanceLiveUtilityReading, _resetLiveUtilityStateForTests } from '../lib/utilities';

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

describe('advanceLiveUtilityReading', () => {
  beforeEach(() => {
    _resetLiveUtilityStateForTests();
  });

  it('stays within plausible bounds across many ticks (no unbounded drift)', () => {
    const basePowerKw = 3000;
    let reading = advanceLiveUtilityReading('metlife-nj', basePowerKw);
    for (let i = 0; i < 200; i += 1) {
      reading = advanceLiveUtilityReading('metlife-nj', basePowerKw);
      expect(reading.powerKw).toBeGreaterThanOrEqual(basePowerKw * 0.7 - 1);
      expect(reading.powerKw).toBeLessThanOrEqual(basePowerKw * 1.2 + 1);
      expect(reading.waterLitersPerMin).toBeGreaterThanOrEqual(299);
      expect(reading.waterLitersPerMin).toBeLessThanOrEqual(801);
      expect(reading.wastePercentFull).toBeGreaterThanOrEqual(0);
      expect(reading.wastePercentFull).toBeLessThanOrEqual(100);
    }
  });

  it('waste capacity only rises between ticks, then wraps low instead of going negative or oscillating down', () => {
    const readings: number[] = [];
    for (let i = 0; i < 50; i += 1) {
      readings.push(advanceLiveUtilityReading('bcplace-ca', 2600).wastePercentFull);
    }
    // Every step is either a rise or a wrap back down near zero — never an
    // arbitrary drop, which would be physically wrong for a waste bin that
    // is only emptied on a schedule.
    for (let i = 1; i < readings.length; i += 1) {
      const delta = readings[i]! - readings[i - 1]!;
      const isRiseOrWrap = delta >= 0 || readings[i]! < 10;
      expect(isRiseOrWrap).toBe(true);
    }
  });

  it('tracks separate state per stadium independently', () => {
    advanceLiveUtilityReading('metlife-nj', 4200);
    advanceLiveUtilityReading('azteca-mx', 3900);
    const a = advanceLiveUtilityReading('metlife-nj', 4200);
    const b = advanceLiveUtilityReading('azteca-mx', 3900);
    // Different base loads should keep their readings in different ranges.
    expect(a.powerKw).not.toBe(b.powerKw);
  });

  it('starts fresh after a reset', () => {
    advanceLiveUtilityReading('metlife-nj', 4200);
    _resetLiveUtilityStateForTests();
    // No throw, and produces a valid first reading again.
    const reading = advanceLiveUtilityReading('metlife-nj', 4200);
    expect(reading.powerKw).toBeGreaterThan(0);
  });
});
