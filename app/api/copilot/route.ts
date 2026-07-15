import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { getStadiumById } from '@/lib/stadiumData';
import { gatherStadiumContext, synthesizeSituationReport, computeStadiumHealthScore } from '@/lib/agents/orchestrator';
import { copilotRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { GeminiError } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`copilot:${clientKey}`, env.rateLimitPerMinute);
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

  const parsed = safeParseBody(copilotRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const stadium = getStadiumById(parsed.data.stadiumId);
  if (!stadium) {
    return NextResponse.json({ error: 'Unknown stadiumId.' }, { status: 404 });
  }

  const context = gatherStadiumContext(stadium);
  const healthScore = computeStadiumHealthScore(context);

  let report = 'All systems normal. No significant risks detected in the next hour.';
  try {
    report = await synthesizeSituationReport(context, parsed.data.operatorQuestion);
  } catch (error) {
    logger.warn('copilot_report_fallback', { error: String(error) });
    if (error instanceof GeminiError) {
      report = 'The AI synthesis is temporarily unavailable — showing raw agent data below.';
    }
  }

  return NextResponse.json({ context, healthScore, report });
}
