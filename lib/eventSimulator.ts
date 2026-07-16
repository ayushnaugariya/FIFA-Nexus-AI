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
 * with figures learned from historical concession/exit telemetry.
 *
 * An earlier version of this model tried to split zones into "concession"
 * vs. "exit" types via a keyword match on the zone name
 * (`/concourse|plaza|puerta|gate/i`) and applied a different multiplier to
 * each. That was a real bug: every zone name in `lib/stadiumData.ts`
 * contains one of those keywords ("North Concourse", "Puerta Oriente",
 * "East Plaza" — all of them double as gate/entrance areas), so the
 * "exit" branch and its distinct messaging could never actually fire with
 * real venue data — dead code disguised as a feature. It's also a more
 * honest model of reality: a stadium's concourse zones ARE its exit
 * routes, not a separate category. The single multiplier below is applied
 * uniformly to every zone; the meaningful differentiation is *between
 * event types* (halftime produces the largest concourse surge, final
 * whistle the largest overall movement), which is real and tested.
 */
const EVENT_PROFILES: Record<MatchEventType, { multiplier: number; reason: string }> = {
  goal_scored: {
    multiplier: 1.2,
    reason: 'Goal celebrations typically trigger a short surge toward concourses and concession stands.',
  },
  halftime: {
    multiplier: 1.55,
    reason: 'Halftime reliably produces the largest concourse surge of the match.',
  },
  final_whistle: {
    multiplier: 1.75,
    reason: 'Full-time triggers the largest movement of the match as fans head for the exits.',
  },
};

export function simulateMatchEvent(eventType: MatchEventType, zones: ZoneSnapshot[]): EventImpactModel {
  const profile = EVENT_PROFILES[eventType];

  const zoneImpacts: PredictedZoneImpact[] = zones.map((zone) => {
    const projected = Math.min(100, Math.round(zone.occupancyPercent * profile.multiplier));
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      currentOccupancyPercent: zone.occupancyPercent,
      projectedOccupancyPercent: projected,
      reason: profile.reason,
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
