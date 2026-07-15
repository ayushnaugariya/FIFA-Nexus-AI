import { describe, expect, it } from 'vitest';
import { buildZoneNeeds } from '../lib/agents/volunteerAgent';
import type { CrowdSnapshot } from '../lib/crowdSim';

const snapshot: CrowdSnapshot = {
  stadiumId: 'metlife-nj',
  generatedAt: new Date().toISOString(),
  zones: [
    { zoneId: 'north', zoneName: 'North Concourse', occupancyPercent: 90, level: 'high', trend: 'rising' },
    { zoneId: 'south', zoneName: 'South Concourse', occupancyPercent: 30, level: 'low', trend: 'steady' },
  ],
};

describe('buildZoneNeeds', () => {
  it('produces one need entry per zone', () => {
    const needs = buildZoneNeeds(snapshot, new Map());
    expect(needs).toHaveLength(2);
  });

  it('gives a higher score to the busier zone even with no incidents', () => {
    const needs = buildZoneNeeds(snapshot, new Map());
    const north = needs.find((n) => n.zoneId === 'north')!;
    const south = needs.find((n) => n.zoneId === 'south')!;
    expect(north.score).toBeGreaterThan(south.score);
  });

  it('adds incident pressure on top of crowd pressure', () => {
    const withoutIncidents = buildZoneNeeds(snapshot, new Map());
    const withIncidents = buildZoneNeeds(snapshot, new Map([['North Concourse', 3]]));
    const before = withoutIncidents.find((n) => n.zoneId === 'north')!.score;
    const after = withIncidents.find((n) => n.zoneId === 'north')!.score;
    expect(after).toBeGreaterThan(before);
  });
});
