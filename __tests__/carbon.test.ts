import { describe, expect, it } from 'vitest';
import { computeCarbonFootprint } from '../lib/carbon';

describe('computeCarbonFootprint', () => {
  it('returns zero emissions for walking regardless of distance', () => {
    const result = computeCarbonFootprint('walk', 12, 2);
    expect(result.totalKgCO2e).toBe(0);
  });

  it('scales linearly with distance and party size', () => {
    const one = computeCarbonFootprint('public-transit', 10, 1);
    const four = computeCarbonFootprint('public-transit', 10, 4);
    expect(four.totalKgCO2e).toBeCloseTo(one.totalKgCO2e * 4, 5);
  });

  it('reports savings versus a personal car trip', () => {
    const transit = computeCarbonFootprint('public-transit', 20, 1);
    const car = computeCarbonFootprint('personal-car', 20, 1);
    expect(transit.savedVsCarKgCO2e).toBeCloseTo(car.totalKgCO2e - transit.totalKgCO2e, 5);
    expect(transit.savedVsCarKgCO2e).toBeGreaterThan(0);
  });

  it('a solo personal car trip has zero savings versus itself', () => {
    const car = computeCarbonFootprint('personal-car', 15, 1);
    expect(car.savedVsCarKgCO2e).toBe(0);
  });

  it('rejects a negative distance', () => {
    expect(() => computeCarbonFootprint('bike', -1, 1)).toThrow(RangeError);
  });

  it('rejects a party size below one', () => {
    expect(() => computeCarbonFootprint('bike', 5, 0)).toThrow(RangeError);
  });
});
