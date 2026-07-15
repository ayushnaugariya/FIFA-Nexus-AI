import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { GeminiError } from '@/lib/gemini';
import { answerFanQuestion } from '@/lib/agents/fanAgent';
import { getStadiumById } from '@/lib/stadiumData';
import { conciergeRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`concierge:${clientKey}`, env.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
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

  const parsed = safeParseBody(conciergeRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const stadium = getStadiumById(parsed.data.stadiumId);
  if (!stadium) {
    return NextResponse.json({ error: 'Unknown stadiumId.' }, { status: 404 });
  }

  try {
    const reply = await answerFanQuestion({
      stadium,
      message: parsed.data.message,
      languageCode: parsed.data.languageCode,
    });
    return NextResponse.json({ reply, stadium: stadium.name });
  } catch (error) {
    logger.error('concierge_failed', { error: String(error) });
    const status = error instanceof GeminiError ? 502 : 500;
    return NextResponse.json(
      { error: 'The concierge is temporarily unavailable. Please ask a steward for help.' },
      { status },
    );
  }
}
