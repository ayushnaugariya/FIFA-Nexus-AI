import type { CrowdSnapshot } from '../crowdSim';
import {
  allocateVolunteers,
  applyAllocationPlan,
  computeZoneNeedScore,
  listVolunteers,
  resetAllocations,
  seedVolunteerPool,
  type AllocationPlan,
  type Volunteer,
  type ZoneNeed,
} from '../volunteers';

/** Ensures a demo pool exists on first use — a real deployment would sync this from a roster system instead. */
export function ensureVolunteerPoolSeeded(defaultCount = 12): void {
  if (listVolunteers().length === 0) {
    seedVolunteerPool(defaultCount);
  }
}

export function buildZoneNeeds(snapshot: CrowdSnapshot, openIncidentCountByZoneName: Map<string, number>): ZoneNeed[] {
  return snapshot.zones.map((zone) => ({
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    score: computeZoneNeedScore(zone.occupancyPercent, openIncidentCountByZoneName.get(zone.zoneName) ?? 0),
  }));
}

export interface VolunteerAgentState {
  pool: Volunteer[];
  plan: AllocationPlan[];
}

export function runVolunteerAllocation(
  snapshot: CrowdSnapshot,
  openIncidentCountByZoneName: Map<string, number>,
): VolunteerAgentState {
  ensureVolunteerPoolSeeded();
  resetAllocations();
  const needs = buildZoneNeeds(snapshot, openIncidentCountByZoneName);
  const pool = listVolunteers();
  const plan = allocateVolunteers(pool, needs);
  applyAllocationPlan(plan);
  return { pool: listVolunteers(), plan };
}
