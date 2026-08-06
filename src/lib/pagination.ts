/**
 * Pagination, as one pure function.
 *
 * Built at M9 for twelve posts and fifty later: nothing here knows about posts,
 * categories or routes, so the blog index, the six category archives and
 * whatever paginates next all share it. Growing the collection changes a
 * number, not a component.
 *
 * The route convention it encodes (docs/ARCHITECTURE.md §2):
 *
 *   page 1  → the bare listing, `/blog` or `/blog/kategori/<slug>`
 *   page 2+ → `…/sayfa/<n>`
 *
 * so **`…/sayfa/1` is never generated**. Two URLs for one page of results is a
 * duplicate, and `pagesAfterFirst()` is what makes that structural rather than
 * a rule someone has to remember.
 */

export type PaginatedResult<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;
};

/**
 * Total pages. **An empty collection is one page, not zero** — the listing
 * still renders, with its empty state. Zero would make `/blog` unreachable at
 * exactly the moment it needs to explain itself.
 */
export function pageCount(totalItems: number, perPage: number): number {
  if (perPage < 1)
    throw new Error(`perPage must be at least 1, got ${perPage}`);
  return Math.max(1, Math.ceil(totalItems / perPage));
}

/**
 * The page numbers that get their own `…/sayfa/<n>` route — 2 upward.
 *
 * Feeds `generateStaticParams`. Empty for a collection that fits on one page,
 * which with `dynamicParams = false` means every `…/sayfa/<n>` URL 404s until
 * there is genuinely a second page.
 */
export function pagesAfterFirst(
  totalItems: number,
  perPage: number,
): readonly number[] {
  const total = pageCount(totalItems, perPage);
  return Array.from({ length: total - 1 }, (_, index) => index + 2);
}

/**
 * Slice one page out of a list.
 *
 * Returns `null` for a page that does not exist, so a route can `notFound()`
 * on it rather than rendering an empty grid at `/blog/sayfa/99`. Page 1 of an
 * empty collection is NOT out of range — it is the empty state.
 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  perPage: number,
): PaginatedResult<T> | null {
  const totalPages = pageCount(items.length, perPage);
  if (!Number.isInteger(page) || page < 1 || page > totalPages) return null;

  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page,
    totalPages,
    totalItems: items.length,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

/**
 * The href for a page number under a base path, honouring the page-1 rule.
 *
 * `hrefForPage('/blog', 1)` is `/blog`, never `/blog/sayfa/1`.
 */
export function hrefForPage(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}/sayfa/${page}`;
}
