import Link from 'next/link';

import { servicePage } from '@/config/services';
import type { Post } from '@/content-layer';
import { formatDateLong } from '@/lib/date';

/**
 * The "down" half of the linking map — a service hub lists its posts, newest
 * first (docs/CONTENT-PLAN.md §5).
 *
 * Renders NOTHING while there are no posts. There are none today: the blog is
 * written at M10, and a heading over an empty list would announce content that
 * does not exist. The moment the first post maps to a service this appears, with
 * no page change — the same pattern as `testimonials` and `channelHref`.
 */
export function RelatedPosts({ posts }: { posts: readonly Post[] }) {
  if (posts.length === 0) return null;

  return (
    <nav aria-labelledby="ilgili-yazilar">
      <h2
        id="ilgili-yazilar"
        className="font-display text-2xl tracking-display text-text-primary"
      >
        {servicePage.detail.relatedPosts}
      </h2>
      <ul className="mt-6 max-w-reading">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-border-decor">
            <Link
              href={`/blog/${post.slug}`}
              className="block py-4 transition-colors hover:bg-surface-decor/40"
            >
              <p className="text-2xs text-text-muted">
                <time dateTime={post.publishedAt}>
                  {formatDateLong(post.publishedAt)}
                </time>
              </p>
              <p className="mt-1 text-text-primary">{post.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
