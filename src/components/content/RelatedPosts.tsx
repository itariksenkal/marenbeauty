import Link from 'next/link';

import type { Post } from '@/content-layer';
import { formatDateLong } from '@/lib/date';

/**
 * A short list of posts, used in two places: the "down" half of the linking map
 * on a service hub, and "İlgili yazılar" at the foot of a post
 * (docs/CONTENT-PLAN.md §5).
 *
 * The heading is a prop rather than a config lookup, because the two callers
 * label it from their own copy files and a component should not have to know
 * which page it is on.
 *
 * Renders NOTHING while there are no posts. A heading over an empty list
 * announces content that does not exist — the same rule `testimonials` and
 * `channelHref` follow.
 */
export function RelatedPosts({
  posts,
  title,
  headingId = 'ilgili-yazilar',
}: {
  posts: readonly Post[];
  title: string;
  headingId?: string;
}) {
  if (posts.length === 0) return null;

  return (
    <nav aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-display text-2xl tracking-display text-text-primary"
      >
        {title}
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
