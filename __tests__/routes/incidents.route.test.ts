import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetRateLimiterForTests } from '../../lib/rateLimiter';
import { _clearIncidentsForTests } from '../../lib/incidentStore';

vi.mock('../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/gemini')>();
  return {
    ...actual,
    askGemini: vi.fn(async () => JSON.stringify({ severity: 'medium', recommendedResponse: 'Send a steward.' })),
  };
});

async function importRoute() {
  return import('../../app/api/incidents/route');
}

function makePostRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/incidents', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  _resetRateLimiterForTests();
  _clearIncidentsForTests();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('POST /api/incidents', () => {
  it('files an incident and returns it with a 201', async () => {
    delete process.env.OPERATOR_API_KEY;
    const { POST } = await importRoute();
    const res = await POST(
      makePostRequest({ stadiumId: 'metlife-nj', zone: 'North', reporterRole: 'steward', description: 'Fan feeling unwell' }),
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.incident.severity).toBe('medium');
    expect(data.incident.zone).toBe('North');
  });

  it('rejects invalid input with 400', async () => {
    delete process.env.OPERATOR_API_KEY;
    const { POST } = await importRoute();
    const res = await POST(makePostRequest({ stadiumId: 'metlife-nj', zone: 'North', reporterRole: 'fan', description: 'x' }));
    expect(res.status).toBe(400);
  });

  it('allows requests through when no operator key is configured (default)', async () => {
    delete process.env.OPERATOR_API_KEY;
    const { POST } = await importRoute();
    const res = await POST(
      makePostRequest({ stadiumId: 'metlife-nj', zone: 'North', reporterRole: 'steward', description: 'Spilled drink near Gate A' }),
    );
    expect(res.status).toBe(201);
  });

  it('rejects with 401 when an operator key is configured but not supplied', async () => {
    process.env.OPERATOR_API_KEY = 'test-operator-key';
    const { POST } = await importRoute();
    const res = await POST(
      makePostRequest({ stadiumId: 'metlife-nj', zone: 'North', reporterRole: 'steward', description: 'Spilled drink near Gate A' }),
    );
    expect(res.status).toBe(401);
  });

  it('accepts the request when the correct Bearer token is supplied', async () => {
    process.env.OPERATOR_API_KEY = 'test-operator-key';
    const { POST } = await importRoute();
    const res = await POST(
      makePostRequest(
        { stadiumId: 'metlife-nj', zone: 'North', reporterRole: 'steward', description: 'Spilled drink near Gate A' },
        { authorization: 'Bearer test-operator-key' },
      ),
    );
    expect(res.status).toBe(201);
  });
});

describe('GET /api/incidents', () => {
  it('returns an empty list when no stadiumId is provided', async () => {
    const { GET } = await importRoute();
    const res = await GET(new NextRequest('http://localhost/api/incidents'));
    const data = await res.json();
    expect(data.incidents).toEqual([]);
  });

  it('returns only incidents for the requested stadium', async () => {
    delete process.env.OPERATOR_API_KEY;
    const { POST, GET } = await importRoute();
    await POST(makePostRequest({ stadiumId: 'metlife-nj', zone: 'North', reporterRole: 'steward', description: 'Test incident one' }));
    await POST(makePostRequest({ stadiumId: 'azteca-mx', zone: 'Oriente', reporterRole: 'steward', description: 'Test incident two' }));

    const res = await GET(new NextRequest('http://localhost/api/incidents?stadiumId=metlife-nj'));
    const data = await res.json();
    expect(data.incidents).toHaveLength(1);
    expect(data.incidents[0].stadiumId).toBe('metlife-nj');
  });
});
