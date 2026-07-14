export type TravelMode =
  | 'walk'
  | 'bike'
  | 'public-transit'
  | 'rideshare-shared'
  | 'rideshare-solo'
  | 'personal-car'
  | 'flight';

/**
 * Grams of CO2-equivalent emitted per passenger-kilometer, per mode.
 * Figures are illustrative averages in line with published transport
 * emissions studies (e.g. UK DEFRA / EPA passenger transport factors),
 * intentionally rounded since this is a fan-facing estimate, not an audit.
 */
const EMISSION_FACTOR_G_PER_KM: Record<TravelMode, number> = {
  walk: 0,
  bike: 0,
  'public-transit': 41,
  'rideshare-shared': 55,
  'rideshare-solo': 120,
  'personal-car': 170,
  flight: 250,
};

export interface CarbonEstimate {
  travelMode: TravelMode;
  distanceKm: number;
  partySize: number;
  totalKgCO2e: number;
  vsPersonalCarKgCO2e: number;
  /** kg CO2e saved per party versus the same trip by personal car. */
  savedVsCarKgCO2e: number;
}

export function computeCarbonFootprint(
  travelMode: TravelMode,
  distanceKm: number,
  partySize = 1,
): CarbonEstimate {
  if (distanceKm < 0) throw new RangeError('distanceKm must be non-negative');
  if (partySize < 1) throw new RangeError('partySize must be at least 1');

  const factor = EMISSION_FACTOR_G_PER_KM[travelMode];
  const totalGrams = factor * distanceKm * partySize;
  const totalKgCO2e = round2(totalGrams / 1000);

  const carFactor = EMISSION_FACTOR_G_PER_KM['personal-car'];
  const vsPersonalCarKgCO2e = round2((carFactor * distanceKm * partySize) / 1000);
  const savedVsCarKgCO2e = round2(vsPersonalCarKgCO2e - totalKgCO2e);

  return {
    travelMode,
    distanceKm,
    partySize,
    totalKgCO2e,
    vsPersonalCarKgCO2e,
    savedVsCarKgCO2e,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
