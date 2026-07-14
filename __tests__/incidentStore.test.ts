import { beforeEach, describe, expect, it } from 'vitest';
import {
  _clearIncidentsForTests,
  addIncident,
  classifySeverityFallback,
  listIncidents,
} from '../lib/incidentStore';

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
    addIncident({
      id: '1',
      stadiumId: 'metlife-nj',
      zone: 'North',
      reporterRole: 'steward',
      description: 'first',
      severity: 'low',
      recommendedResponse: 'log it',
      createdAt: new Date().toISOString(),
    });
    addIncident({
      id: '2',
      stadiumId: 'metlife-nj',
      zone: 'South',
      reporterRole: 'medical',
      description: 'second',
      severity: 'high',
      recommendedResponse: 'respond',
      createdAt: new Date().toISOString(),
    });
    const all = listIncidents();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe('2');
  });

  it('filters by stadiumId', () => {
    addIncident({
      id: '1',
      stadiumId: 'azteca-mx',
      zone: 'Oriente',
      reporterRole: 'steward',
      description: 'x',
      severity: 'low',
      recommendedResponse: 'y',
      createdAt: new Date().toISOString(),
    });
    addIncident({
      id: '2',
      stadiumId: 'metlife-nj',
      zone: 'North',
      reporterRole: 'steward',
      description: 'x',
      severity: 'low',
      recommendedResponse: 'y',
      createdAt: new Date().toISOString(),
    });
    expect(listIncidents('azteca-mx')).toHaveLength(1);
    expect(listIncidents('metlife-nj')).toHaveLength(1);
  });
});
