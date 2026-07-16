import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { fileIncidentReport, getActiveIncidents } from '@/lib/agents/safetyAgent';
import { getStadiumById } from '@/lib/stadiumData';
import { incidentSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { isOperatorRequestAuthorized } from '@/lib/auth';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const stadiumId = request.nextUrl.searchParams.get('stadiumId') ?? undefined;
  return NextResponse.json({ incidents: stadiumId ? getActiveIncidents(stadiumId) : [] });
}

export async function POST(request: NextRequest) {
  // Filing an incident is a staff action (reporterRole is always a staff
  // role — volunteer/steward/medical/security/ops-manager). Gated behind
  // the optional operator key; see lib/auth.ts.
  if (!isOperatorRequestAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`incidents:${clientKey}`, env.rateLimitPerMinute);
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

  const parsed = safeParseBody(incidentSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Unlike concierge/transport/event, this route previously never checked
  // the stadium actually exists — an incident could silently be filed
  // against a nonexistent stadiumId. Matches the rest of the codebase now.
  if (!getStadiumById(parsed.data.stadiumId)) {
    return NextResponse.json({ error: 'Unknown stadiumId.' }, { status: 404 });
  }

  const incident = await fileIncidentReport(parsed.data);
  return NextResponse.json({ incident }, { status: 201 });
}
