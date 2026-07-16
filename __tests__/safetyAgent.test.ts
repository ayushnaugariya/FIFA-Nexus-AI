import { beforeEach, describe, expect, it } from 'vitest';
import { countOpenIncidentsByZoneName, getActiveIncidents } from '../lib/agents/safetyAgent';
import { _clearIncidentsForTests, addIncident, resolveIncident, type Incident } from '../lib/incidentStore';

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: '1',
    stadiumId: 'a',
    zone: 'X',
    reporterRole: 'steward',
    description: 'd',
    severity: 'low',
    recommendedResponse: 'r',
    createdAt: new Date().toISOString(),
    status: 'open',
    resolvedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  _clearIncidentsForTests();
});

describe('getActiveIncidents', () => {
  it('returns only incidents for the requested stadium', () => {
    addIncident(makeIncident({ id: '1', stadiumId: 'a' }));
    addIncident(makeIncident({ id: '2', stadiumId: 'b' }));
    expect(getActiveIncidents('a')).toHaveLength(1);
  });

  it('excludes resolved incidents — "active" should mean open, not "ever filed"', () => {
    addIncident(makeIncident({ id: '1', stadiumId: 'a' }));
    addIncident(makeIncident({ id: '2', stadiumId: 'a' }));
    resolveIncident('1');
    const active = getActiveIncidents('a');
    expect(active).toHaveLength(1);
    expect(active[0]!.id).toBe('2');
  });
});

describe('countOpenIncidentsByZoneName', () => {
  it('groups incident counts by zone name', () => {
    addIncident(makeIncident({ id: '1', zone: 'North' }));
    addIncident(makeIncident({ id: '2', zone: 'North', severity: 'high' }));
    addIncident(makeIncident({ id: '3', zone: 'South' }));
    const counts = countOpenIncidentsByZoneName('a');
    expect(counts.get('North')).toBe(2);
    expect(counts.get('South')).toBe(1);
  });

  it('returns an empty map when there are no incidents', () => {
    expect(countOpenIncidentsByZoneName('a').size).toBe(0);
  });

  it('stops counting a zone once its incident is resolved — regression test for permanently-inflated need scores', () => {
    addIncident(makeIncident({ id: '1', zone: 'North' }));
    resolveIncident('1');
    expect(countOpenIncidentsByZoneName('a').get('North')).toBeUndefined();
  });
});
