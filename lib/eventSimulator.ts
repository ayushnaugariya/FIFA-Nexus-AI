import type { ZoneSnapshot } from './crowdSim';

export type MatchEventType = 'goal_scored' | 'halftime' | 'final_whistle';

export interface PredictedZoneImpact {
  zoneId: string;
  zoneName: string;
  currentOccupancyPercent: number;
  projectedOccupancyPercent: number;
  reason: string;
}

export interface EventImpactModel {
  eventType: MatchEventType;
  zoneImpacts: PredictedZoneImpact[];
  recommendedVolunteers: number;
  recommendedActions: string[];
  expectedWaitTimeReductionPercent: number;
  expectedCongestionReductionPercent: number;
}

/**
 * A deterministic, explainable impact model per event type. These
 * multipliers are illustrative reference values (the brief's own worked
 * example uses similar magnitudes); a production system would replace them
 * with figures learned from historical concession/exit telemetry, but the
 * *shape* of the reasoning — food/restroom surge after a goal, exit surge
 * after full time — is what actually matters for the recommendation logic,
 * and that shape is what this function encodes and what the tests check.
 */
const EVENT_PROFILES: Record<
  MatchEventType,
  { concessionMultiplier: number; exitMultiplier: number; reasonConcession: string; reasonExit: string }
> = {
  goal_scored: {
    concessionMultiplier: 1.25,
    exitMultiplier: 1.05,
    reasonConcession: 'Goal celebrations typically trigger a short surge toward food/merchandise concourses.',
    reasonExit: 'Minor incidental movement near exits as fans reposition.',
  },
  halftime: {
    concessionMultiplier: 1.6,
    exitMultiplier: 1.1,
    reasonConcession: 'Halftime reliably produces the largest concourse surge of the match.',
    reasonExit: 'Some early-leaving fans begin moving toward exits.',
  },
  final_whistle: {
    concessionMultiplier: 1.1,
    exitMultiplier: 1.9,
    reasonConcession: 'Concession demand drops as fans prioritize leaving.',
    reasonExit: 'Full-time triggers the largest exit and transport surge of the match.',
  },
};

function isConcessionZone(zone: ZoneSnapshot): boolean {
  return /concourse|plaza|puerta|gate/i.test(zone.zoneName);
}

export function simulateMatchEvent(eventType: MatchEventType, zones: ZoneSnapshot[]): EventImpactModel {
  const profile = EVENT_PROFILES[eventType];

  const zoneImpacts: PredictedZoneImpact[] = zones.map((zone) => {
    const multiplier = isConcessionZone(zone) ? profile.concessionMultiplier : profile.exitMultiplier;
    const projected = Math.min(100, Math.round(zone.occupancyPercent * multiplier));
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      currentOccupancyPercent: zone.occupancyPercent,
      projectedOccupancyPercent: projected,
      reason: isConcessionZone(zone) ? profile.reasonConcession : profile.reasonExit,
    };
  });

  const zonesNewlyAtRisk = zoneImpacts.filter(
    (z) => z.projectedOccupancyPercent >= 80 && z.currentOccupancyPercent < 80,
  ).length;

  const recommendedActions: string[] = [];
  if (zonesNewlyAtRisk > 0) {
    recommendedActions.push(
      `Deploy additional stewards to ${zonesNewlyAtRisk} zone(s) projected to cross 80% occupancy.`,
    );
  }
  if (eventType === 'halftime') {
    recommendedActions.push('Open any closed concession counters for the halftime window.');
  }
  if (eventType === 'final_whistle') {
    recommendedActions.push('Notify transportation authorities of the imminent departure surge.');
    recommendedActions.push('Open all available exit lanes; hold non-essential closures until the crowd clears.');
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('No additional action needed — projected impact is within normal operating range.');
  }

  return {
    eventType,
    zoneImpacts,
    recommendedVolunteers: Math.min(10, zonesNewlyAtRisk * 2),
    recommendedActions,
    expectedWaitTimeReductionPercent: zonesNewlyAtRisk > 0 ? 35 : 0,
    expectedCongestionReductionPercent: zonesNewlyAtRisk > 0 ? 28 : 0,
  };
}
