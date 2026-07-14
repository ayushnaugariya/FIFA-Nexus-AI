import { NextRequest, NextResponse } from 'next/server';
import { estimateFanFootprint } from '@/lib/agents/sustainabilityAgent';
import { sustainabilityRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`sustainability:${clientKey}`, env.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = safeParseBody(sustainabilityRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await estimateFanFootprint(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('sustainability_failed', { error: String(error) });
    return NextResponse.json({ error: 'Could not calculate your footprint.' }, { status: 500 });
  }
}
