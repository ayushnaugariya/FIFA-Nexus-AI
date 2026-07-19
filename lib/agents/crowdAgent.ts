import type { Stadium } from '../stadiumData';
import { classifyCrowdLevel, generateCrowdSnapshot, recommendActions, type CrowdSnapshot, type ZoneSnapshot } from '../crowdSim';
import { advanceZoneOccupancy, peekZoneOccupancy, type AdvancedZoneState } from '../crowdLiveState';
import { forecastOccupancy, willCrossCritical, type ForecastPoint } from '../prediction';

const SAMPLE_INTERVAL_MINUTES = 5;

/**
 * Reconstructs a short recent-history series from a single snapshot's
 * occupancy + trend. Used only on the deterministic/seeded path (tests,
 * reproducible demos) where there's no persisted history to draw on — the
 * live path below uses lib/crowdLiveState.ts's real rolling history
 * instead. Pure and fully testable.
 */
export function buildOccupancyHistory(zone: ZoneSnapshot): number[] {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  if (zone.trend === 'rising') {
    return [clamp(zone.occupancyPercent - 10), clamp(zone.occupancyPercent - 5), zone.occupancyPercent];
  }
  if (zone.trend === 'falling') {
    return [clamp(zone.occupancyPercent + 10), clamp(zone.occupancyPercent + 5), zone.occupancyPercent];
  }
  return [zone.occupancyPercent, zone.occupancyPercent, zone.occupancyPercent];
}

export interface ZoneForecast {
  zoneId: string;
  zoneName: string;
  forecast: ForecastPoint[];
  willBecomeCriticalAt: ForecastPoint | null;
}

export interface CrowdAgentState {
  snapshot: CrowdSnapshot;
  recommendations: ReturnType<typeof recommendActions>;
  forecasts: ZoneForecast[];
}

/**
 * Core engine for the Crowd Agent. It reads the current zone states using
 * the provided reader function (which either advances the simulation or just
 * peeks at it), classifies current crowd levels, generates time-series
 * forecasts for future congestion, and computes actionable recommendations
 * (e.g. dynamic signage updates or volunteer reallocations).
 * 
 * @param stadium The stadium configuration containing zone definitions.
 * @param reader Function to fetch the current and historical occupancy for a zone.
 */
function buildLiveCrowdAgentState(
  stadium: Stadium,
  reader: (stadiumId: string, zoneId: string) => AdvancedZoneState,
): CrowdAgentState {
  const zones: ZoneSnapshot[] = [];
  const forecasts: ZoneForecast[] = [];
  for (const zone of stadium.zones) {
    const { occupancyPercent, trend, history } = reader(stadium.id, zone.id);
    zones.push({
      zoneId: zone.id,
      zoneName: zone.name,
      occupancyPercent,
      level: classifyCrowdLevel(occupancyPercent),
      trend,
    });
    const forecast =
      history.length >= 1
        ? forecastOccupancy(history, SAMPLE_INTERVAL_MINUTES)
        : forecastOccupancy([occupancyPercent], SAMPLE_INTERVAL_MINUTES);
    forecasts.push({ zoneId: zone.id, zoneName: zone.name, forecast, willBecomeCriticalAt: willCrossCritical(forecast) });
  }

  const snapshot: CrowdSnapshot = { stadiumId: stadium.id, generatedAt: new Date().toISOString(), zones };
  const recommendations = recommendActions(snapshot, stadium);
  return { snapshot, recommendations, forecasts };
}

/**
 * `seed` provided → deterministic path (tests, reproducible screenshots):
 * pure `generateCrowdSnapshot` + a synthesized history.
 *
 * `seed` omitted → live path, and this is the ONLY caller anywhere in the
 * codebase that should be calling `advanceZoneOccupancy` — every tick this
 * runs, the shared live state moves forward. That makes it correct for
 * exactly one caller: the SSE stream's periodic tick (`app/api/crowd/stream`),
 * which is the single intended "clock" driving the simulation. Anything
 * else that wants to read current state — the Operations Copilot, the
 * Command Center's context polling — must use `peekCrowdAgentState`
 * instead, or querying the app more often would make the crowd simulation
 * run faster than real time. This was a real bug: `gatherStadiumContext`
 * (used by every `/api/copilot` call) used to call this function, so every
 * Copilot question independently advanced the same shared state the SSE
 * tick was also advancing.
 */
export function getCrowdAgentState(stadium: Stadium, seed?: number): CrowdAgentState {
  if (seed !== undefined) {
    const snapshot = generateCrowdSnapshot(stadium, seed);
    const recommendations = recommendActions(snapshot, stadium);
    const forecasts: ZoneForecast[] = snapshot.zones.map((zone) => {
      const forecast = forecastOccupancy(buildOccupancyHistory(zone), SAMPLE_INTERVAL_MINUTES);
      return { zoneId: zone.zoneId, zoneName: zone.zoneName, forecast, willBecomeCriticalAt: willCrossCritical(forecast) };
    });
    return { snapshot, recommendations, forecasts };
  }
  return buildLiveCrowdAgentState(stadium, advanceZoneOccupancy);
}

/**
 * Read-only equivalent of the live path above: reports current occupancy
 * without advancing the shared random walk. Use this for anything that
 * reads live state outside the SSE tick itself (Operations Copilot,
 * periodic context polling) — see the warning on `getCrowdAgentState`.
 */
export function peekCrowdAgentState(stadium: Stadium): CrowdAgentState {
  return buildLiveCrowdAgentState(stadium, peekZoneOccupancy);
}
