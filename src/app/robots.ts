import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/config/seo';

/**
 * `robots.txt`.
 *
 * Allow everything except the API surface, and point at the sitemap.
 *
 * `/api/` is disallowed because none of it is content: two of the three routes
 * are POST/GET handlers for the contact form, and the third 404s in production.
 * Crawling them would waste budget and could, in the case of `/api/altcha`,
 * mint challenges nobody will solve.
 *
 * `/lisanslar` is NOT disallowed. It sets `noindex` in its own metadata, which
 * a crawler can only obey if it is allowed to fetch the page and read the tag —
 * blocking it in robots.txt would leave it indexable-by-reference and unread.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
