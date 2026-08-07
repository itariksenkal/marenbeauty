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

  /**
   * Security headers.
   *
   * Defined HERE and not in `vercel.json`, deliberately. Headers configured on
   * the platform apply only on that platform, and the portability rule says the
   * container must serve the same site (`CLAUDE.md` §3) — a self-hosted
   * deployment that quietly loses its security headers is exactly the kind of
   * difference M16 exists to prevent.
   *
   * No `Content-Security-Policy` yet. The layout ships two inline scripts by
   * design — the motion-tier resolver, which must run before first paint, and
   * the JSON-LD block — so a meaningful CSP needs per-request nonces, which
   * would make every page dynamic. That is a real trade against a real benefit
   * and it belongs in a decision, not in a config file written in passing.
   * Recorded in `docs/OPEN-QUESTIONS.md` G27.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Referrer: origin only on cross-origin requests. The site has no
          // query-string secrets, but a path can name what a visitor read.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // No MIME sniffing. `/lisanslar` serves 1,200 lines of plain text.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Framing: nobody embeds this site, and clickjacking a contact form
          // is a real, cheap attack.
          { key: 'X-Frame-Options', value: 'DENY' },
          // The site asks for no device permission at all. Saying so is free.
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          // Two years, subdomains included. Set only once the apex is on HTTPS,
          // which the DNS cutover does before this ever ships (docs/DEPLOY.md).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
      /*
       * There is deliberately NO Cache-Control rule for `/_next/static` here.
       *
       * It is tempting — fingerprinted assets should be immutable for a year —
       * but Next already sets exactly `public, max-age=31536000, immutable` on
       * that folder itself, in production, on Vercel and in the standalone
       * server alike (`next/dist/server/lib/router-server.js`). So the rule
       * bought nothing, and it cost something: Next only applies its own value
       * `if (!res.getHeader('cache-control'))`, and the branch it skips when a
       * custom header is present is the DEV one, which serves
       * `no-cache, must-revalidate`. A custom rule here therefore pins every
       * chunk in `npm run dev` as immutable for a year, and the browser keeps
       * serving a stale one across edits. That is what Next means by the build
       * warning "Setting a custom Cache-Control header can break Next.js
       * development behavior" — it fires for any `source` under `/_next/`.
       */
      {
        // The self-hosted images are NOT fingerprinted — the manifest points at
        // stable paths so the whole set can be swapped in one file. A day of
        // browser cache with a week of stale-while-revalidate is the right
        // trade: a real-photography swap goes live within a week without a
        // rename, and nobody re-downloads 5 MB on every visit.
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

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
