import { NextRequest, NextResponse } from 'next/server';
import { resolveIncidentReport } from '@/lib/agents/safetyAgent';
import { isOperatorRequestAuthorized } from '@/lib/auth';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isOperatorRequestAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`incidents-resolve:${clientKey}`, env.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing incident id.' }, { status: 400 });
  }

  const incident = resolveIncidentReport(id);
  if (!incident) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
  }

  return NextResponse.json({ incident });
}
