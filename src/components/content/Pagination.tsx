import Link from 'next/link';

import { blog } from '@/config/blog';
import { hrefForPage, type PaginatedResult } from '@/lib/pagination';

/**
 * Previous / next across pages of a listing.
 *
 * Renders nothing for a single-page listing — no greyed-out arrows, no lonely
 * "1". The same absence-not-placeholder rule the contact channels follow.
 *
 * `hrefForPage` owns the page-1 convention, so this component cannot emit
 * `…/sayfa/1` even by arithmetic accident.
 *
 * Deliberately just two links and a position, rather than a numbered strip:
 * fifty posts is five pages, and five numbers add clutter without adding
 * navigation. Every post is also reachable from its category and from the
 * service it maps to (docs/CONTENT-PLAN.md §5), so pagination is not the only
 * path to anything.
 */
export function Pagination({
  result,
  basePath,
}: {
  result: PaginatedResult<unknown>;
  /** `/blog` or `/blog/kategori/<slug>`. Never ends in `/sayfa`. */
  basePath: string;
}) {
  if (result.totalPages <= 1) return null;

  return (
    <nav
      aria-label={blog.pagination.navLabel}
      className="flex items-center justify-between gap-4 border-t border-border-decor pt-6"
    >
      {result.hasPrevious ? (
        <Link
          href={hrefForPage(basePath, result.page - 1)}
          rel="prev"
          className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {blog.pagination.previous}
        </Link>
      ) : (
        <span />
      )}

      <p className="text-sm text-text-muted">
        {blog.pagination.pageWord} {result.page} / {result.totalPages}
      </p>

      {result.hasNext ? (
        <Link
          href={hrefForPage(basePath, result.page + 1)}
          rel="next"
          className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {blog.pagination.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
