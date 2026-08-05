import type { NextConfig } from 'next';

/**
 * Canonical host is the apex (docs/OPEN-QUESTIONS.md C2, docs/SEO.md §1).
 * This redirect must agree with the Vercel domain setting — a disagreement
 * between the two is a redirect loop.
 */
const CANONICAL_HOST = 'marenbeauty.com';

const nextConfig: NextConfig = {
  // Portability rule — CLAUDE.md §3. The app must run under `docker run`
  // with no Vercel services.
  output: 'standalone',

  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: `www.${CANONICAL_HOST}` }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
