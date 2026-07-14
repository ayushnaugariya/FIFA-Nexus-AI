import type { Stadium } from '../stadiumData';
import { generateCrowdSnapshot, recommendActions, type CrowdSnapshot, type ZoneSnapshot } from '../crowdSim';
import { forecastOccupancy, willCrossCritical, type ForecastPoint } from '../prediction';

const SAMPLE_INTERVAL_MINUTES = 5;

/**
 * Reconstructs a short recent-history series from a single snapshot's
 * occupancy + trend, so the deterministic forecaster has something to
 * extrapolate from without needing a real time-series telemetry store yet.
 * Pure and fully testable.
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

export function getCrowdAgentState(stadium: Stadium, seed?: number): CrowdAgentState {
  const snapshot = generateCrowdSnapshot(stadium, seed);
  const recommendations = recommendActions(snapshot, stadium);

  const forecasts: ZoneForecast[] = snapshot.zones.map((zone) => {
    const history = buildOccupancyHistory(zone);
    const forecast = forecastOccupancy(history, SAMPLE_INTERVAL_MINUTES);
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      forecast,
      willBecomeCriticalAt: willCrossCritical(forecast),
    };
  });

  return { snapshot, recommendations, forecasts };
}
