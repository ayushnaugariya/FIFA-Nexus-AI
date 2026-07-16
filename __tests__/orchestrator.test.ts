import { beforeEach, describe, expect, it } from 'vitest';
import { computeStadiumHealthScore, gatherStadiumContext, type StadiumContext } from '../lib/agents/orchestrator';
import { STADIUMS } from '../lib/stadiumData';
import { _clearIncidentsForTests, addIncident } from '../lib/incidentStore';
import { _resetVolunteersForTests } from '../lib/volunteers';

const stadium = STADIUMS[0]!;

function baseContext(seed: number): StadiumContext {
  return gatherStadiumContext(stadium, seed);
}

describe('gatherStadiumContext', () => {
  beforeEach(() => {
    _clearIncidentsForTests();
    _resetVolunteersForTests();
  });

  it('gathers crowd, incidents, volunteers and utilities in one call', () => {
    const context = baseContext(1);
    expect(context.stadium.id).toBe(stadium.id);
    expect(context.crowd.snapshot.zones.length).toBeGreaterThan(0);
    expect(Array.isArray(context.incidents)).toBe(true);
    expect(context.volunteers.pool.length).toBeGreaterThan(0);
    expect(context.utilities.reading.powerKw).toBeGreaterThan(0);
  });

  it('reflects incidents filed for the stadium', () => {
    addIncident({
      id: '1',
      stadiumId: stadium.id,
      zone: 'North Concourse',
      reporterRole: 'steward',
      description: 'test',
      severity: 'high',
      recommendedResponse: 'respond',
      createdAt: new Date().toISOString(),
      status: 'open',
      resolvedAt: null,
    });
    const context = baseContext(2);
    expect(context.incidents).toHaveLength(1);
  });

  it('live path (no seed) reads current crowd state without advancing it — regression test for the bug where every Copilot call independently drove the shared crowd simulation forward', async () => {
    const { _resetCrowdLiveStateForTests } = await import('../lib/crowdLiveState');
    const { getCrowdAgentState } = await import('../lib/agents/crowdAgent');
    _resetCrowdLiveStateForTests();

    const tick = getCrowdAgentState(stadium); // the one real "clock" tick
    const contextA = gatherStadiumContext(stadium); // no seed - live path
    const contextB = gatherStadiumContext(stadium); // called again moments later

    expect(contextA.crowd.snapshot.zones).toEqual(tick.snapshot.zones);
    expect(contextB.crowd.snapshot.zones).toEqual(tick.snapshot.zones);
  });

  it('excludes resolved incidents — regression test for the bug where a resolved incident kept degrading the score forever', () => {
    addIncident({
      id: '1',
      stadiumId: stadium.id,
      zone: 'North Concourse',
      reporterRole: 'steward',
      description: 'test',
      severity: 'critical',
      recommendedResponse: 'respond',
      createdAt: new Date().toISOString(),
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    const context = baseContext(6);
    expect(context.incidents).toHaveLength(0);
  });
});

describe('computeStadiumHealthScore', () => {
  beforeEach(() => {
    _clearIncidentsForTests();
    _resetVolunteersForTests();
  });

  it('returns 100 when nothing is wrong', () => {
    const context = baseContext(3);
    // Force a calm context regardless of the seeded random crowd/utility draw.
    const calm: StadiumContext = {
      ...context,
      crowd: {
        ...context.crowd,
        snapshot: {
          ...context.crowd.snapshot,
          zones: context.crowd.snapshot.zones.map((z) => ({ ...z, occupancyPercent: 30, level: 'low' as const })),
        },
      },
      incidents: [],
      utilities: { reading: context.utilities.reading, status: 'normal' },
    };
    expect(computeStadiumHealthScore(calm)).toBe(100);
  });

  it('penalizes critical crowd zones more than high zones', () => {
    const context = baseContext(4);
    const withCritical: StadiumContext = {
      ...context,
      crowd: {
        ...context.crowd,
        snapshot: {
          ...context.crowd.snapshot,
          zones: context.crowd.snapshot.zones.map((z, i) => ({
            ...z,
            occupancyPercent: i === 0 ? 97 : 30,
            level: i === 0 ? ('critical' as const) : ('low' as const),
          })),
        },
      },
      incidents: [],
      utilities: { reading: context.utilities.reading, status: 'normal' },
    };
    const withHigh: StadiumContext = {
      ...withCritical,
      crowd: {
        ...withCritical.crowd,
        snapshot: {
          ...withCritical.crowd.snapshot,
          zones: withCritical.crowd.snapshot.zones.map((z, i) => ({
            ...z,
            occupancyPercent: i === 0 ? 85 : 30,
            level: i === 0 ? ('high' as const) : ('low' as const),
          })),
        },
      },
    };
    expect(computeStadiumHealthScore(withCritical)).toBeLessThan(computeStadiumHealthScore(withHigh));
  });

  it('never returns below 0', () => {
    const context = baseContext(5);
    const disaster: StadiumContext = {
      ...context,
      crowd: {
        ...context.crowd,
        snapshot: {
          ...context.crowd.snapshot,
          zones: context.crowd.snapshot.zones.map((z) => ({ ...z, occupancyPercent: 99, level: 'critical' as const })),
        },
      },
      incidents: [
        { id: '1', stadiumId: stadium.id, zone: 'x', reporterRole: 'steward', description: 'x', severity: 'critical', recommendedResponse: 'x', createdAt: new Date().toISOString(), status: 'open', resolvedAt: null },
        { id: '2', stadiumId: stadium.id, zone: 'x', reporterRole: 'steward', description: 'x', severity: 'critical', recommendedResponse: 'x', createdAt: new Date().toISOString(), status: 'open', resolvedAt: null },
      ],
      utilities: { reading: context.utilities.reading, status: 'action-needed' },
    };
    expect(computeStadiumHealthScore(disaster)).toBe(0);
  });
});
