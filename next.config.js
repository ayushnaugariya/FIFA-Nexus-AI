/** @type {import('next').NextConfig} */
// Content-Security-Policy is applied by middleware.ts instead of here —
// next.config.js runs in plain Node before Next's TS/bundler pipeline
// exists, so it can't import the shared lib/csp.ts source of truth. The
// headers below have no such constraint and are safe to declare statically.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
