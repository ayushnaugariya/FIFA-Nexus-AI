import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, PayloadTooLargeError } from '@/lib/requestGuard';
import { getStadiumById } from '@/lib/stadiumData';
import { classifyCrowdLevel, type CrowdSnapshot, type ZoneSnapshot } from '@/lib/crowdSim';
import { peekZoneOccupancy } from '@/lib/crowdLiveState';
import { simulateMatchEvent } from '@/lib/eventSimulator';
import { askGemini } from '@/lib/gemini';
import { eventRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { isOperatorRequestAuthorized } from '@/lib/auth';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isOperatorRequestAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`event:${clientKey}`, env.rateLimitPerMinute);
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

  const parsed = safeParseBody(eventRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const stadium = getStadiumById(parsed.data.stadiumId);
  if (!stadium) {
    return NextResponse.json({ error: 'Unknown stadiumId.' }, { status: 404 });
  }

  // Read (never advance) the same shared live state the Command Center and
  // Operations Copilot use, so "before" here always matches what's on the
  // dashboard right now — simulating a hypothetical event must not itself
  // perturb the live occupancy just because someone asked a "what if".
  const zones: ZoneSnapshot[] = stadium.zones.map((zone) => {
    const { occupancyPercent, trend } = peekZoneOccupancy(stadium.id, zone.id);
    return { zoneId: zone.id, zoneName: zone.name, occupancyPercent, level: classifyCrowdLevel(occupancyPercent), trend };
  });
  const snapshot: CrowdSnapshot = { stadiumId: stadium.id, generatedAt: new Date().toISOString(), zones };

  const impact = simulateMatchEvent(parsed.data.eventType, snapshot.zones);

  let announcement = defaultAnnouncement(parsed.data.eventType, stadium.name);
  try {
    announcement = await askGemini({
      systemInstruction: [
        'You draft short public-address / signage announcements for a FIFA World Cup 2026 stadium.',
        'Write ONE upbeat, calm sentence (max 25 words) appropriate for a stadium screen or PA system.',
        'Never mention internal operations data, staffing, or AI systems — fans should just hear a friendly, clear message.',
      ].join('\n'),
      userContent: JSON.stringify({ eventType: parsed.data.eventType, stadium: stadium.name, impact: impact.recommendedActions }),
      maxOutputTokens: 60,
    });
  } catch (error) {
    logger.warn('event_announcement_fallback', { error: String(error) });
  }

  return NextResponse.json({ impact, announcement });
}

function defaultAnnouncement(eventType: string, stadiumName: string): string {
  if (eventType === 'final_whistle') return `Thanks for joining us at ${stadiumName} — please follow steward guidance as you exit.`;
  if (eventType === 'halftime') return `Enjoy halftime — concession stands are open throughout the concourse.`;
  return `What a moment! Refreshments and merchandise are available at every concourse.`;
}
