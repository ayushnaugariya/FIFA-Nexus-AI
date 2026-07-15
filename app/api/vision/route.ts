import { NextRequest, NextResponse } from 'next/server';
import { inspectCameraFrame } from '@/lib/agents/safetyAgent';
import { VisionInputError } from '@/lib/vision';
import { visionRequestSchema, safeParseBody } from '@/lib/validation';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { readJsonBody, PayloadTooLargeError, VISION_MAX_BYTES } from '@/lib/requestGuard';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { GeminiError } from '@/lib/gemini';

export const runtime = 'nodejs';

// Vision calls are more expensive than text — a tighter per-IP limit than the other agents.
const VISION_RATE_LIMIT_PER_MINUTE = Math.max(3, Math.floor(env.rateLimitPerMinute / 4));

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`vision:${clientKey}`, VISION_RATE_LIMIT_PER_MINUTE);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Vision inspection is rate-limited.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, VISION_MAX_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = safeParseBody(visionRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const analysis = await inspectCameraFrame(parsed.data.imageBase64, parsed.data.mimeType);
    return NextResponse.json({ analysis });
  } catch (error) {
    logger.error('vision_failed', { error: String(error) });
    if (error instanceof VisionInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const status = error instanceof GeminiError ? 502 : 500;
    return NextResponse.json({ error: 'Vision inspection is temporarily unavailable.' }, { status });
  }
}
