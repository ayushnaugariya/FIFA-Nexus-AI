import { beforeEach, describe, expect, it } from 'vitest';
import {
  _clearIncidentsForTests,
  addIncident,
  classifySeverityFallback,
  listIncidents,
  resolveIncident,
  type Incident,
} from '../lib/incidentStore';

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: '1',
    stadiumId: 'metlife-nj',
    zone: 'North Concourse',
    reporterRole: 'steward',
    description: 'test incident',
    severity: 'low',
    recommendedResponse: 'log it',
    createdAt: new Date().toISOString(),
    status: 'open',
    resolvedAt: null,
    ...overrides,
  };
}

describe('classifySeverityFallback', () => {
  it('classifies life-threatening keywords as critical', () => {
    expect(classifySeverityFallback('There is a fire near Gate B').severity).toBe('critical');
    expect(classifySeverityFallback('A fan is unconscious in section 12').severity).toBe('critical');
  });

  it('classifies injury/medical keywords as high', () => {
    expect(classifySeverityFallback('A fan has a serious injury near the concourse').severity).toBe('high');
  });

  it('classifies disruptive-but-manageable reports as medium', () => {
    expect(classifySeverityFallback('We have a lost child at Gate A').severity).toBe('medium');
  });

  it('classifies everything else as low', () => {
    expect(classifySeverityFallback('The merchandise stand ran out of size L shirts').severity).toBe('low');
  });

  it('always returns a recommended response, never an empty string', () => {
    const result = classifySeverityFallback('Random unmatched description');
    expect(result.recommendedResponse.length).toBeGreaterThan(0);
  });
});

describe('incident store', () => {
  beforeEach(() => {
    _clearIncidentsForTests();
  });

  it('starts empty and returns newly added incidents in reverse-chronological order', () => {
    expect(listIncidents()).toHaveLength(0);
    addIncident(makeIncident({ id: '1', description: 'first', severity: 'low' }));
    addIncident(makeIncident({ id: '2', zone: 'South Concourse', reporterRole: 'medical', description: 'second', severity: 'high' }));
    const all = listIncidents();
    expect(all).toHaveLength(2);
    expect(all[0]!.id).toBe('2');
  });

  it('filters by stadiumId', () => {
    addIncident(makeIncident({ id: '1', stadiumId: 'azteca-mx', zone: 'Puerta Oriente' }));
    addIncident(makeIncident({ id: '2', stadiumId: 'metlife-nj' }));
    expect(listIncidents('azteca-mx')).toHaveLength(1);
    expect(listIncidents('metlife-nj')).toHaveLength(1);
  });

  it('excludes resolved incidents by default — the actual bug this fixes', () => {
    addIncident(makeIncident({ id: '1' }));
    addIncident(makeIncident({ id: '2' }));
    resolveIncident('1');
    const open = listIncidents('metlife-nj');
    expect(open).toHaveLength(1);
    expect(open[0]!.id).toBe('2');
  });

  it('includes resolved incidents when explicitly requested (audit view)', () => {
    addIncident(makeIncident({ id: '1' }));
    resolveIncident('1');
    expect(listIncidents('metlife-nj', { includeResolved: true })).toHaveLength(1);
    expect(listIncidents('metlife-nj')).toHaveLength(0);
  });

  it('resolveIncident sets status and resolvedAt, and returns the updated incident', () => {
    addIncident(makeIncident({ id: '1' }));
    const resolved = resolveIncident('1');
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedAt).not.toBeNull();
  });

  it('resolveIncident returns null for an unknown id', () => {
    expect(resolveIncident('does-not-exist')).toBeNull();
  });
});
