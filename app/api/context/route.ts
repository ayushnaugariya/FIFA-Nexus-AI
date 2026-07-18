import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { getStadiumById } from '@/lib/stadiumData';
import { gatherStadiumContext } from '@/lib/agents/orchestrator';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Lightweight context endpoint — returns the live stadium context
 * (incidents, volunteers, utilities) WITHOUT calling Gemini.
 * Used by the Command Center sidebar to populate utilities/volunteers
 * panels independently of the AI copilot.
 */
export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`context:${clientKey}`, env.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = body as { stadiumId?: string };
  const stadiumId = typeof parsed?.stadiumId === 'string' ? parsed.stadiumId : '';
  const stadium = getStadiumById(stadiumId);
  if (!stadium) {
    return NextResponse.json({ error: 'Unknown stadiumId.' }, { status: 404 });
  }

  // gatherStadiumContext is synchronous and never calls Gemini —
  // it only reads the in-process simulation state (crowd, incidents, volunteers, utilities).
  const context = gatherStadiumContext(stadium);

  return NextResponse.json({
    incidents: context.incidents,
    volunteers: context.volunteers,
    utilities: context.utilities,
  });
}
