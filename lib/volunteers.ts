export interface Volunteer {
  id: string;
  name: string;
  status: 'available' | 'assigned';
  assignedZoneId: string | null;
}

export interface ZoneNeed {
  zoneId: string;
  zoneName: string;
  /** Higher = more urgently needs staff. Combines crowd level + open incidents. */
  score: number;
}

export interface AllocationPlan {
  zoneId: string;
  zoneName: string;
  volunteerIds: string[];
}

const MAX_VOLUNTEERS_PER_ZONE = 3;

let volunteers: Volunteer[] = [];

export function seedVolunteerPool(count: number): void {
  volunteers = Array.from({ length: count }, (_, i) => ({
    id: `vol-${i + 1}`,
    name: `Volunteer ${i + 1}`,
    status: 'available',
    assignedZoneId: null,
  }));
}

export function listVolunteers(): Volunteer[] {
  return [...volunteers];
}

export function _resetVolunteersForTests(): void {
  volunteers = [];
}

/**
 * Combines crowd pressure and open-incident pressure into a single need
 * score per zone. Pure and deterministic so it is fully unit-testable; the
 * weights (60/40) are a reference starting point, easy to tune later
 * against real deployment outcomes.
 */
export function computeZoneNeedScore(occupancyPercent: number, openIncidentCount: number): number {
  const crowdComponent = occupancyPercent * 0.6;
  const incidentComponent = Math.min(openIncidentCount, 5) * 20 * 0.4;
  return Math.round(crowdComponent + incidentComponent);
}

/**
 * Greedy allocator: highest-need zones are staffed first, up to a per-zone
 * cap, until either every zone is satisfied or the volunteer pool runs out.
 * Pure with respect to its inputs — callers pass a pool snapshot and get a
 * plan back rather than the function mutating global state, which is what
 * makes it independently testable.
 */
export function allocateVolunteers(pool: Volunteer[], needs: ZoneNeed[]): AllocationPlan[] {
  const available = pool.filter((v) => v.status === 'available').map((v) => v.id);
  const sortedNeeds = [...needs].sort((a, b) => b.score - a.score);

  const plan: AllocationPlan[] = [];
  let cursor = 0;

  for (const need of sortedNeeds) {
    if (need.score <= 0 || cursor >= available.length) continue;
    const slots = Math.min(MAX_VOLUNTEERS_PER_ZONE, available.length - cursor);
    const assigned = available.slice(cursor, cursor + slots);
    if (assigned.length === 0) continue;
    cursor += assigned.length;
    plan.push({ zoneId: need.zoneId, zoneName: need.zoneName, volunteerIds: assigned });
  }

  return plan;
}

/**
 * Clears all current assignments back to "available" before a fresh
 * allocation pass. Modeling continuous re-optimization each cycle (rather
 * than one-way permanent assignment) matches how a live copilot would
 * actually behave as conditions shift through the match.
 */
export function resetAllocations(): void {
  volunteers = volunteers.map((v) => ({ ...v, status: 'available', assignedZoneId: null }));
}

export function applyAllocationPlan(plan: AllocationPlan[]): void {
  const zoneByVolunteerId = new Map<string, string>();
  for (const entry of plan) {
    for (const id of entry.volunteerIds) zoneByVolunteerId.set(id, entry.zoneId);
  }
  volunteers = volunteers.map((v) =>
    zoneByVolunteerId.has(v.id)
      ? { ...v, status: 'assigned', assignedZoneId: zoneByVolunteerId.get(v.id) as string }
      : v,
  );
}
