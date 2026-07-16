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

const liveUtilityState = new Map<string, UtilityReading>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function jitter(magnitude: number): number {
  return (Math.random() * 2 - 1) * magnitude;
}

/**
 * Persisted, smoothly-evolving live reading per stadium — the same bug
 * class as the crowd occupancy fix in lib/crowdLiveState.ts:
 * `getVenueUtilityState` (lib/agents/sustainabilityAgent.ts) used to fall
 * back to `Date.now()` as the seed whenever none was given, so every poll
 * of the Utilities panel drew a completely independent random reading —
 * power/water/waste would jump to unrelated values every 20s instead of
 * evolving. Waste capacity only trends upward between empties (it doesn't
 * spontaneously drop), which the previous fully-random version also got
 * physically wrong.
 */
export function advanceLiveUtilityReading(stadiumId: string, basePowerKw: number): UtilityReading {
  const previous = liveUtilityState.get(stadiumId);

  const next: UtilityReading = previous
    ? {
        powerKw: Math.round(clamp(previous.powerKw + jitter(basePowerKw * 0.02), basePowerKw * 0.7, basePowerKw * 1.2)),
        waterLitersPerMin: Math.round(clamp(previous.waterLitersPerMin + jitter(15), 300, 800)),
        // Waste capacity only rises — it's emptied on a schedule, not continuously —
        // and wraps back to a low value once it would have been serviced.
        wastePercentFull: (() => {
          const raised = previous.wastePercentFull + Math.random() * 1.5;
          return Math.round(raised >= 100 ? 5 : raised);
        })(),
      }
    : simulateUtilityReading(basePowerKw, Date.now());

  liveUtilityState.set(stadiumId, next);
  return next;
}

export function _resetLiveUtilityStateForTests(): void {
  liveUtilityState.clear();
}
