import { NextRequest } from 'next/server';
import { getStadiumById } from '@/lib/stadiumData';
import { getCrowdAgentState } from '@/lib/agents/crowdAgent';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rateLimiter';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

const TICK_MS = 5_000;
// Auto-close after 15 minutes so an abandoned/never-read connection can't
// hold a server-side setInterval open indefinitely; EventSource reconnects
// automatically, so the client experience is unaffected.
const MAX_CONNECTION_MS = 15 * 60_000;

/**
 * A lightweight Server-Sent Events stream standing in for a Kafka/Pub-Sub
 * telemetry bus in this reference build (see README §9 for the production
 * path). SSE is one-directional and reconnects natively via `EventSource`,
 * which is exactly the shape the Command Center's live occupancy feed
 * needs, without pulling in a message-broker dependency for a demo.
 */
export async function GET(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  // Rate-limited on *connection establishment*, not per-tick — a client
  // opening many streams in a burst is throttled; an already-open stream's
  // periodic pushes are not requests and don't count against the budget.
  const rateLimit = checkRateLimit(`crowd-stream:${clientKey}`, env.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Too many stream connections. Please wait a moment.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  const stadiumId = request.nextUrl.searchParams.get('stadiumId') ?? '';
  const stadium = getStadiumById(stadiumId);
  if (!stadium) {
    return new Response(JSON.stringify({ error: 'Unknown or missing stadiumId.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        if (closed) return;
        try {
          const state = getCrowdAgentState(stadium);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
        } catch {
          // If a single tick fails to serialize, skip it rather than killing the stream.
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearTimeout(maxDurationTimer);
        try {
          controller.close();
        } catch {
          // Already closed — ignore.
        }
      };

      send(); // Emit an immediate first frame so the UI doesn't wait a full tick.
      const interval = setInterval(send, TICK_MS);
      const maxDurationTimer = setTimeout(close, MAX_CONNECTION_MS);

      request.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
