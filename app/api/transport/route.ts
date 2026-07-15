import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { GeminiError } from '@/lib/gemini';
import { recommendTransport } from '@/lib/agents/transportAgent';
import { getStadiumById } from '@/lib/stadiumData';
import { transportRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`transport:${clientKey}`, env.rateLimitPerMinute);
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

  const parsed = safeParseBody(transportRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const stadium = getStadiumById(parsed.data.stadiumId);
  if (!stadium) {
    return NextResponse.json({ error: 'Unknown stadiumId.' }, { status: 404 });
  }

  try {
    const recommendation = await recommendTransport({
      stadium,
      originDescription: parsed.data.originDescription,
      kickoffMinutesFromNow: parsed.data.kickoffMinutesFromNow,
      mobilityNeeds: parsed.data.mobilityNeeds,
    });
    return NextResponse.json({ recommendation, stadium: stadium.name });
  } catch (error) {
    logger.error('transport_failed', { error: String(error) });
    const status = error instanceof GeminiError ? 502 : 500;
    return NextResponse.json(
      { error: 'The transport planner is temporarily unavailable. Please check on-site signage.' },
      { status },
    );
  }
}
