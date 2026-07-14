import { askGemini } from '../gemini';
import { computeCarbonFootprint, type CarbonEstimate, type TravelMode } from '../carbon';
import { classifyUtilityStatus, simulateUtilityReading, type UtilityReading, type UtilityStatus } from '../utilities';

export async function estimateFanFootprint(input: {
  travelMode: TravelMode;
  distanceKm: number;
  partySize: number;
}): Promise<{ estimate: CarbonEstimate; tip: string }> {
  const estimate = computeCarbonFootprint(input.travelMode, input.distanceKm, input.partySize);

  let tip = 'Every lower-carbon trip to the match adds up across a full tournament of fans — nice work.';
  try {
    tip = await askGemini({
      systemInstruction: [
        'You are the Sustainability Agent of FIFA Nexus AI, coaching a fan on trip emissions.',
        'Given a carbon estimate, write ONE encouraging sentence (max 30 words) with a concrete next-step tip.',
        'Never guilt-trip the fan. Never invent numbers beyond what is given.',
      ].join('\n'),
      userContent: JSON.stringify(estimate),
      maxOutputTokens: 80,
    });
  } catch {
    // Keep the default tip — the estimate itself is unaffected by an AI failure.
  }

  return { estimate, tip };
}

export interface VenueUtilityState {
  reading: UtilityReading;
  status: UtilityStatus;
}

const BASE_POWER_KW: Record<string, number> = {
  'metlife-nj': 4200,
  'azteca-mx': 3900,
  'bcplace-ca': 2600,
};

export function getVenueUtilityState(stadiumId: string, seed?: number): VenueUtilityState {
  const basePowerKw = BASE_POWER_KW[stadiumId] ?? 3000;
  const reading = simulateUtilityReading(basePowerKw, seed ?? Date.now());
  const status = classifyUtilityStatus(reading, basePowerKw);
  return { reading, status };
}
