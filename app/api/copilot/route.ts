import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { getStadiumById } from '@/lib/stadiumData';
import { gatherStadiumContext, synthesizeSituationReport, computeStadiumHealthScore } from '@/lib/agents/orchestrator';
import { copilotRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

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

  // synthesizeSituationReport always returns a meaningful report — it tries
  // Gemini first and silently falls back to a data-driven template if the
  // model is unavailable, so no error handling is needed here.
  const report = await synthesizeSituationReport(context, parsed.data.operatorQuestion);
  logger.info('copilot_report_generated', { stadiumId: stadium.id, length: report.length });

  return NextResponse.json({ context, healthScore, report });
}
