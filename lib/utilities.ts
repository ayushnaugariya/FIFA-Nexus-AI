export interface UtilityReading {
  powerKw: number;
  waterLitersPerMin: number;
  wastePercentFull: number;
}

export type UtilityStatus = 'normal' | 'elevated' | 'action-needed';

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Deterministic mock telemetry standing in for a real building-management
 * system feed. Ranges are loosely modeled on a large stadium's typical
 * match-day draw so the numbers feel plausible in a demo.
 */
export function simulateUtilityReading(basePowerKw: number, seed: number): UtilityReading {
  const random = seededRandom(seed || 1);
  return {
    powerKw: Math.round(basePowerKw * (0.85 + random() * 0.3)),
    waterLitersPerMin: Math.round(400 + random() * 300),
    wastePercentFull: Math.round(20 + random() * 70),
  };
}

export function classifyUtilityStatus(reading: UtilityReading, basePowerKw: number): UtilityStatus {
  if (reading.wastePercentFull >= 85 || reading.powerKw >= basePowerKw * 1.1) {
    return 'action-needed';
  }
  if (reading.wastePercentFull >= 65 || reading.powerKw >= basePowerKw) {
    return 'elevated';
  }
  return 'normal';
}
