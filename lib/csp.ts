/**
 * Builds the Content-Security-Policy header value.
 *
 * A nonce-based `script-src` (dropping 'unsafe-inline' via
 * `'nonce-x' 'strict-dynamic'`) was implemented and empirically tested
 * against a production build. It broke the app: Next.js's statically
 * prerendered pages (`x-nextjs-cache: HIT`) ship their `<script>` tags
 * baked into HTML generated at *build* time, with no nonce attribute —
 * they can't have one, since the nonce is only known per-request, at
 * middleware time, long after that HTML was cached. `'strict-dynamic'`
 * then discards the `'self'` fallback per the CSP3 spec, so every one of
 * those un-nonced framework scripts gets silently blocked by the browser
 * and the app never hydrates. Forcing every route to dynamic rendering
 * would fix that but throws away static optimization app-wide for a
 * marginal XSS reduction — not a good trade for an app with no
 * user-generated HTML rendering path (all user content renders as React
 * text, which is auto-escaped; there is no `dangerouslySetInnerHTML`
 * anywhere in this codebase — verified by grep in CI-equivalent review).
 * `'unsafe-inline'` on script-src is kept, deliberately, for that reason.
 */
export function buildContentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    // Google Fonts CSS (style sheet) + font files
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // Allow same-origin images and data URIs (for vision uploader previews)
    "img-src 'self' data: blob:",
    // Same-origin fetches + EventSource; also allow ws:// for Next.js HMR in dev
    "connect-src 'self' ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
