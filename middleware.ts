import { NextRequest, NextResponse } from 'next/server';
import { buildContentSecurityPolicy } from '@/lib/csp';

/**
 * Applies Content-Security-Policy on every response. This lives in
 * middleware (rather than next.config.js's static `headers()`) purely so
 * it can share `lib/csp.ts` as its one source of truth — see that file for
 * why the policy is static rather than nonce-based.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy());
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next's internals.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
