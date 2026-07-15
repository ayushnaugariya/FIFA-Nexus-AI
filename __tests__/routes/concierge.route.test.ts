import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetRateLimiterForTests } from '../../lib/rateLimiter';

vi.mock('../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/gemini')>();
  return {
    ...actual,
    askGemini: vi.fn(async () => 'Gate A is on the North Concourse, a short walk from your seat.'),
  };
});

async function importRoute() {
  return import('../../app/api/concierge/route');
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/concierge', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  _resetRateLimiterForTests();
});

describe('POST /api/concierge', () => {
  it('returns a grounded reply for a valid request', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ message: 'Where is Gate A?', stadiumId: 'metlife-nj' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.reply).toContain('Gate A');
    expect(data.stadium).toBe('MetLife Stadium');
  });

  it('rejects an empty message with 400', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ message: '', stadiumId: 'metlife-nj' }));
    expect(res.status).toBe(400);
  });

  it('rejects an unknown stadiumId with 404', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ message: 'hi', stadiumId: 'not-a-real-stadium' }));
    expect(res.status).toBe(404);
  });

  it('rejects a request missing required fields with 400', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ message: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('rate-limits after repeated requests from the same client', async () => {
    const { POST } = await importRoute();
    const clientHeaders = { 'x-forwarded-for': '203.0.113.9' };
    let lastStatus = 200;
    // env.rateLimitPerMinute defaults to 20 in this test environment.
    for (let i = 0; i < 25; i += 1) {
      const res = await POST(makeRequest({ message: 'hi', stadiumId: 'metlife-nj' }, clientHeaders));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('rejects a malformed JSON body with 400, not a 500', async () => {
    const { POST } = await importRoute();
    const request = new NextRequest('http://localhost/api/concierge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not valid json',
    });
    const res = await POST(request);
    expect(res.status).toBe(400);
  });
});
