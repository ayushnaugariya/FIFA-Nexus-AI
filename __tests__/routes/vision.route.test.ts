import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { _resetRateLimiterForTests } from '../../lib/rateLimiter';

vi.mock('../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/gemini')>();
  return { ...actual, askGemini: vi.fn() };
});

// lib/vision.ts talks to the SDK directly (not via lib/gemini.ts), so it's
// mocked at the SDK boundary instead.
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: vi.fn(async () => ({
          response: {
            text: () =>
              JSON.stringify({
                crowdDensityEstimate: 'moderate',
                hazardsDetected: [],
                accessibilityNotes: [],
                summary: 'Concourse looks normal.',
              }),
          },
        })),
      }),
    })),
  };
});

async function importRoute() {
  return import('../../app/api/vision/route');
}

const SMALL_BASE64 = Buffer.from('a'.repeat(800)).toString('base64');

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/vision', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  _resetRateLimiterForTests();
  process.env.GEMINI_API_KEY = 'test-key-for-vision-route-tests';
});

describe('POST /api/vision', () => {
  it('analyzes a valid small image and returns structured results', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ imageBase64: SMALL_BASE64, mimeType: 'image/jpeg' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.analysis.crowdDensityEstimate).toBe('moderate');
  });

  it('rejects a disallowed MIME type with 400', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ imageBase64: SMALL_BASE64, mimeType: 'image/gif' }));
    expect(res.status).toBe(400);
  });

  it('rejects a missing imageBase64 field with 400', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ mimeType: 'image/jpeg' }));
    expect(res.status).toBe(400);
  });

  it('applies a tighter rate limit than the text-based agent routes', async () => {
    const { POST } = await importRoute();
    let lastStatus = 200;
    for (let i = 0; i < 10; i += 1) {
      const res = await POST(makeRequest({ imageBase64: SMALL_BASE64, mimeType: 'image/jpeg' }));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
