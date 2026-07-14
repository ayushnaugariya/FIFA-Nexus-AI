import type { Stadium } from './stadiumData';

export type CrowdLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ZoneSnapshot {
  zoneId: string;
  zoneName: string;
  occupancyPercent: number;
  level: CrowdLevel;
  trend: 'rising' | 'falling' | 'steady';
}

export interface CrowdSnapshot {
  stadiumId: string;
  generatedAt: string;
  zones: ZoneSnapshot[];
}

export function classifyCrowdLevel(occupancyPercent: number): CrowdLevel {
  if (occupancyPercent >= 95) return 'critical';
  if (occupancyPercent >= 80) return 'high';
  if (occupancyPercent >= 50) return 'moderate';
  return 'low';
}

/**
 * A small seeded pseudo-random generator so demo data is reproducible in
 * tests and screenshots rather than flickering on every render.
 */
function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function generateCrowdSnapshot(stadium: Stadium, seed: number = Date.now()): CrowdSnapshot {
  const random = seededRandom(seed || 1);
  const trends: ZoneSnapshot['trend'][] = ['rising', 'falling', 'steady'];

  const zones: ZoneSnapshot[] = stadium.zones.map((zone) => {
    const occupancyPercent = Math.round(30 + random() * 70);
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      occupancyPercent,
      level: classifyCrowdLevel(occupancyPercent),
      trend: trends[Math.floor(random() * trends.length)] ?? 'steady',
    };
  });

  return {
    stadiumId: stadium.id,
    generatedAt: new Date().toISOString(),
    zones,
  };
}

/**
 * Pure decision-support logic: given a snapshot, decide which zones need a
 * staff recommendation and what that recommendation is. This is what the
 * Gemini briefing call is grounded on, and it is fully unit-testable
 * without any network access.
 */
export interface ZoneRecommendation {
  zoneId: string;
  zoneName: string;
  level: CrowdLevel;
  action: string;
}

export function recommendActions(snapshot: CrowdSnapshot, stadium: Stadium): ZoneRecommendation[] {
  const recs: ZoneRecommendation[] = [];
  for (const zone of snapshot.zones) {
    if (zone.level === 'critical') {
      const alternative = stadium.zones.find((z) => z.id !== zone.zoneId);
      recs.push({
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        level: zone.level,
        action: alternative
          ? `Open overflow queuing and redirect arriving fans toward ${alternative.name} (${alternative.gates.join('/')}).`
          : 'Open overflow queuing and pause non-essential entries until occupancy drops below 90%.',
      });
    } else if (zone.level === 'high' && zone.trend === 'rising') {
      recs.push({
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        level: zone.level,
        action: `Add stewards to ${zone.zoneName} and monitor; occupancy is high and still rising.`,
      });
    }
  }
  return recs;
}
