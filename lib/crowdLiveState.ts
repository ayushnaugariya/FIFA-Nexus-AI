/**
 * `generateCrowdSnapshot()` (lib/crowdSim.ts) is deliberately pure and
 * seed-deterministic for testability — but calling it with no seed at three
 * different call sites (the SSE stream, the Operations Copilot, the Event
 * Simulator) meant each one independently drew `Date.now()`-seeded random
 * numbers with zero relation to each other or to the previous tick. That
 * produced two real, user-visible bugs:
 *
 * 1. The live heatmap jumped erratically every 5s (no continuity between
 *    ticks) instead of evolving the way real telemetry would.
 * 2. The same zone could show a completely different "current" occupancy
 *    on the dashboard vs. in a Copilot answer vs. in the event simulator,
 *    all queried within the same few seconds — nothing agreed with itself.
 *
 * This module is the fix: one persisted, bounded random-walk value per
 * (stadium, zone), advanced a small step each time it's read. Every live
 * consumer reads through here, so they all see the same evolving reality.
 */

interface ZoneLiveState {
  occupancyPercent: number;
  direction: 1 | -1;
  /** Last few real readings, oldest first — feeds lib/prediction.ts with actual data instead of a guess. */
  history: number[];
}

const liveState = new Map<string, ZoneLiveState>();
const MAX_HISTORY = 5;

function keyFor(stadiumId: string, zoneId: string): string {
  return `${stadiumId}:${zoneId}`;
}

const MIN_OCCUPANCY = 15;
const MAX_OCCUPANCY = 100;
const MIN_STEP = 2;
const MAX_STEP = 6;
/** Chance the walk spontaneously changes direction even mid-range, so it doesn't just ping-pong wall-to-wall. */
const DIRECTION_FLIP_CHANCE = 0.15;

export interface AdvancedZoneState {
  occupancyPercent: number;
  trend: 'rising' | 'falling' | 'steady';
  /** Real recent readings (oldest first), including this tick's result. */
  history: number[];
}

/**
 * Advances (and returns) the live occupancy for one zone by one tick. Pure
 * with respect to nothing — it's intentionally stateful, like
 * `lib/incidentStore.ts` and `lib/volunteers.ts` — but the *step logic* is
 * isolated in `stepOnce` below so that behavior is unit-testable without
 * depending on module-level state or `Math.random`.
 */
export function advanceZoneOccupancy(stadiumId: string, zoneId: string): AdvancedZoneState {
  const key = keyFor(stadiumId, zoneId);
  const existing = liveState.get(key);
  const previous: ZoneLiveState = existing ?? {
    occupancyPercent: 30 + Math.random() * 40,
    direction: Math.random() < 0.5 ? 1 : -1,
    history: [],
  };

  const stepped = stepOnce(previous, Math.random(), Math.random(), Math.random());
  const history = [...previous.history, stepped.occupancyPercent].slice(-MAX_HISTORY);
  const next: ZoneLiveState = { ...stepped, history };
  liveState.set(key, next);

  return {
    occupancyPercent: Math.round(stepped.occupancyPercent),
    trend: stepped.direction === 1 ? 'rising' : 'falling',
    history: history.map((v) => Math.round(v)),
  };
}

/**
 * The actual random-walk math, factored out from `advanceZoneOccupancy` so
 * it can be tested with injected random values instead of mocking
 * `Math.random` globally. `flipRoll`/`stepRoll`/`edgeRoll` are each in
 * [0, 1); callers pass `Math.random()` for each in production.
 */
export function stepOnce(
  previous: Pick<ZoneLiveState, 'occupancyPercent' | 'direction'>,
  flipRoll: number,
  stepRoll: number,
  _edgeRoll: number,
): Pick<ZoneLiveState, 'occupancyPercent' | 'direction'> {
  let direction = previous.direction;
  if (flipRoll < DIRECTION_FLIP_CHANCE) {
    direction = direction === 1 ? -1 : 1;
  }

  const step = (MIN_STEP + stepRoll * (MAX_STEP - MIN_STEP)) * direction;
  let occupancyPercent = previous.occupancyPercent + step;

  // Bounce off the edges instead of clamping-and-sticking, so a zone that
  // hits the ceiling doesn't just flatline at 100 forever.
  if (occupancyPercent >= MAX_OCCUPANCY) {
    occupancyPercent = MAX_OCCUPANCY;
    direction = -1;
  } else if (occupancyPercent <= MIN_OCCUPANCY) {
    occupancyPercent = MIN_OCCUPANCY;
    direction = 1;
  }

  return { occupancyPercent, direction };
}

export function _resetCrowdLiveStateForTests(): void {
  liveState.clear();
}

/**
 * Reads a zone's current live occupancy WITHOUT advancing it. Used by the
 * Event Simulator: asking "what if a goal is scored right now?" should
 * read the current dashboard state as the "before" baseline, not itself
 * perturb that state by an extra random-walk step just because someone
 * viewed a prediction. Initializes state on first read (same starting
 * distribution as `advanceZoneOccupancy`) so a zone never read before
 * still returns a sensible value instead of undefined.
 */
export function peekZoneOccupancy(stadiumId: string, zoneId: string): AdvancedZoneState {
  const key = keyFor(stadiumId, zoneId);
  const existing = liveState.get(key);
  if (existing) {
    return {
      occupancyPercent: Math.round(existing.occupancyPercent),
      trend: existing.direction === 1 ? 'rising' : 'falling',
      history: existing.history.map((v) => Math.round(v)),
    };
  }

  // First-ever read for this zone: initialize and persist a starting point
  // (so a subsequent advance/peek is continuous with it) but don't count
  // this as a "step" — there's no prior state to have stepped from.
  const initial: ZoneLiveState = {
    occupancyPercent: 30 + Math.random() * 40,
    direction: Math.random() < 0.5 ? 1 : -1,
    history: [],
  };
  liveState.set(key, initial);
  return {
    occupancyPercent: Math.round(initial.occupancyPercent),
    trend: initial.direction === 1 ? 'rising' : 'falling',
    history: [],
  };
}
