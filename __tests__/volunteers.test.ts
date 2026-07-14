import { describe, expect, it } from 'vitest';
import { allocateVolunteers, computeZoneNeedScore, type Volunteer, type ZoneNeed } from '../lib/volunteers';

describe('computeZoneNeedScore', () => {
  it('increases with occupancy', () => {
    expect(computeZoneNeedScore(80, 0)).toBeGreaterThan(computeZoneNeedScore(40, 0));
  });

  it('increases with open incidents', () => {
    expect(computeZoneNeedScore(50, 3)).toBeGreaterThan(computeZoneNeedScore(50, 0));
  });

  it('caps the incident contribution so one runaway count cannot dominate', () => {
    expect(computeZoneNeedScore(50, 5)).toBe(computeZoneNeedScore(50, 50));
  });
});

describe('allocateVolunteers', () => {
  const pool: Volunteer[] = Array.from({ length: 5 }, (_, i) => ({
    id: `v${i + 1}`,
    name: `V${i + 1}`,
    status: 'available',
    assignedZoneId: null,
  }));

  it('staffs the highest-need zone first', () => {
    const needs: ZoneNeed[] = [
      { zoneId: 'low', zoneName: 'Low need', score: 10 },
      { zoneId: 'high', zoneName: 'High need', score: 90 },
    ];
    const plan = allocateVolunteers(pool, needs);
    expect(plan[0]?.zoneId).toBe('high');
  });

  it('never assigns more than the per-zone cap of 3', () => {
    const needs: ZoneNeed[] = [{ zoneId: 'a', zoneName: 'A', score: 100 }];
    const plan = allocateVolunteers(pool, needs);
    expect(plan[0]?.volunteerIds.length).toBeLessThanOrEqual(3);
  });

  it('never assigns a volunteer to more than one zone', () => {
    const needs: ZoneNeed[] = [
      { zoneId: 'a', zoneName: 'A', score: 100 },
      { zoneId: 'b', zoneName: 'B', score: 90 },
    ];
    const plan = allocateVolunteers(pool, needs);
    const allAssigned = plan.flatMap((p) => p.volunteerIds);
    expect(new Set(allAssigned).size).toBe(allAssigned.length);
  });

  it('skips zones with a zero or negative score', () => {
    const needs: ZoneNeed[] = [{ zoneId: 'a', zoneName: 'A', score: 0 }];
    expect(allocateVolunteers(pool, needs)).toHaveLength(0);
  });

  it('stops allocating once the pool is exhausted', () => {
    const smallPool: Volunteer[] = [{ id: 'v1', name: 'V1', status: 'available', assignedZoneId: null }];
    const needs: ZoneNeed[] = [
      { zoneId: 'a', zoneName: 'A', score: 100 },
      { zoneId: 'b', zoneName: 'B', score: 90 },
    ];
    const plan = allocateVolunteers(smallPool, needs);
    const totalAssigned = plan.reduce((sum, p) => sum + p.volunteerIds.length, 0);
    expect(totalAssigned).toBe(1);
  });

  it('does not assign volunteers who are already assigned', () => {
    const mixedPool: Volunteer[] = [
      { id: 'v1', name: 'V1', status: 'assigned', assignedZoneId: 'x' },
      { id: 'v2', name: 'V2', status: 'available', assignedZoneId: null },
    ];
    const needs: ZoneNeed[] = [{ zoneId: 'a', zoneName: 'A', score: 100 }];
    const plan = allocateVolunteers(mixedPool, needs);
    expect(plan[0]?.volunteerIds).toEqual(['v2']);
  });
});
