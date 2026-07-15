import { beforeEach, describe, expect, it } from 'vitest';
import { countOpenIncidentsByZoneName, getActiveIncidents } from '../lib/agents/safetyAgent';
import { _clearIncidentsForTests, addIncident } from '../lib/incidentStore';

beforeEach(() => {
  _clearIncidentsForTests();
});

describe('getActiveIncidents', () => {
  it('returns only incidents for the requested stadium', () => {
    addIncident({ id: '1', stadiumId: 'a', zone: 'X', reporterRole: 'steward', description: 'd', severity: 'low', recommendedResponse: 'r', createdAt: new Date().toISOString() });
    addIncident({ id: '2', stadiumId: 'b', zone: 'X', reporterRole: 'steward', description: 'd', severity: 'low', recommendedResponse: 'r', createdAt: new Date().toISOString() });
    expect(getActiveIncidents('a')).toHaveLength(1);
  });
});

describe('countOpenIncidentsByZoneName', () => {
  it('groups incident counts by zone name', () => {
    addIncident({ id: '1', stadiumId: 'a', zone: 'North', reporterRole: 'steward', description: 'd', severity: 'low', recommendedResponse: 'r', createdAt: new Date().toISOString() });
    addIncident({ id: '2', stadiumId: 'a', zone: 'North', reporterRole: 'steward', description: 'd', severity: 'high', recommendedResponse: 'r', createdAt: new Date().toISOString() });
    addIncident({ id: '3', stadiumId: 'a', zone: 'South', reporterRole: 'steward', description: 'd', severity: 'low', recommendedResponse: 'r', createdAt: new Date().toISOString() });
    const counts = countOpenIncidentsByZoneName('a');
    expect(counts.get('North')).toBe(2);
    expect(counts.get('South')).toBe(1);
  });

  it('returns an empty map when there are no incidents', () => {
    expect(countOpenIncidentsByZoneName('a').size).toBe(0);
  });
});
