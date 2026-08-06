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

      /*
       * Page 1 of a listing lives at the bare path and nowhere else
       * (`src/lib/pagination.ts`). `/blog/sayfa/1` is therefore never generated
       * — but it is the first thing a curious visitor types after seeing
       * `/blog/sayfa/2`, so it redirects rather than 404s. The page still does
       * not exist; it simply resolves to the URL that does.
       */
      { source: '/blog/sayfa/1', destination: '/blog', permanent: true },
      {
        source: '/blog/kategori/:slug/sayfa/1',
        destination: '/blog/kategori/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
