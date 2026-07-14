/**
 * Lightweight linear-trend forecasting.
 *
 * A production system would replace this with a proper time-series model
 * fed by real turnstile/beacon telemetry. For a reference build, a clamped
 * linear extrapolation over the last few observations is transparent,
 * deterministic, and fully unit-testable without any ML dependency —
 * exactly the property you want before wiring in a "real" model later.
 */

export interface ForecastPoint {
  minutesFromNow: number;
  projectedOccupancyPercent: number;
}

/**
 * `history` is a series of recent occupancy readings (oldest first, most
 * recent last), sampled at a fixed interval (`sampleIntervalMinutes` apart).
 * Returns projections at each requested horizon, clamped to [0, 100].
 */
export function forecastOccupancy(
  history: number[],
  sampleIntervalMinutes: number,
  horizonsMinutes: number[] = [15, 30, 60],
): ForecastPoint[] {
  if (history.length === 0) {
    throw new RangeError('history must contain at least one reading');
  }
  if (sampleIntervalMinutes <= 0) {
    throw new RangeError('sampleIntervalMinutes must be positive');
  }

  const last = history[history.length - 1] as number;

  // Need at least two points to infer a slope; otherwise assume flat.
  const slopePerMinute =
    history.length >= 2 ? computeSlopePerMinute(history, sampleIntervalMinutes) : 0;

  return horizonsMinutes.map((minutesFromNow) => ({
    minutesFromNow,
    projectedOccupancyPercent: clamp(last + slopePerMinute * minutesFromNow, 0, 100),
  }));
}

/**
 * Ordinary least-squares slope over the recent readings, expressed in
 * occupancy-percent change per minute.
 */
function computeSlopePerMinute(history: number[], sampleIntervalMinutes: number): number {
  const n = history.length;
  const xs = history.map((_, i) => i * sampleIntervalMinutes);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = history.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] as number;
    const dy = history[i] as number;
    numerator += (dx - meanX) * (dy - meanY);
    denominator += (dx - meanX) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Flags a zone as "at risk" if its projected occupancy crosses the critical
 * threshold within the given horizon, even though it hasn't yet — this is
 * what turns the Crowd Intelligence Agent from reactive to predictive.
 */
export function willCrossCritical(forecast: ForecastPoint[], criticalThreshold = 95): ForecastPoint | null {
  return forecast.find((point) => point.projectedOccupancyPercent >= criticalThreshold) ?? null;
}
