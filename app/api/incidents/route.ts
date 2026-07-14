import { NextRequest, NextResponse } from 'next/server';
import { fileIncidentReport, getActiveIncidents } from '@/lib/agents/safetyAgent';
import { incidentSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const stadiumId = request.nextUrl.searchParams.get('stadiumId') ?? undefined;
  return NextResponse.json({ incidents: stadiumId ? getActiveIncidents(stadiumId) : [] });
}

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`incidents:${clientKey}`, env.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = safeParseBody(incidentSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const incident = await fileIncidentReport(parsed.data);
  return NextResponse.json({ incident }, { status: 201 });
}
