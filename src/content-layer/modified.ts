import { newestContentMtime } from './load';

/**
 * The newest modification time across every content collection.
 *
 * Used by the sitemap for pages that are COMPOSED rather than authored — the
 * home page, the service index, `/sss` — where "when did this page last
 * change" has no single source file to point at.
 *
 * Computed once at module scope, like every other content read.
 */
const lastModified = newestContentMtime(['services', 'blog', 'legal', 'pages']);

export function contentLastModified(): Date {
  return lastModified;
}
