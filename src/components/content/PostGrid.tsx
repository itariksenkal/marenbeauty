import Link from 'next/link';

import { blog } from '@/config/blog';
import type { Post } from '@/content-layer';

import { PostCard } from './PostCard';

/**
 * A grid of posts, or an honest empty state.
 *
 * The empty state is a **real sentence** (`src/config/blog.ts`), not a skeleton,
 * not a spinner, not "yakında". It says what is true — nothing is published yet
 * — and offers the one thing that does exist, the service pages. A visitor who
 * lands here learns something either way.
 *
 * `emptyMessage` is passed in rather than chosen here, because "no posts at all"
 * and "no posts in this category" are different sentences.
 */
export function PostGrid({
  posts,
  emptyMessage,
}: {
  posts: readonly Post[];
  emptyMessage: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="max-w-reading">
        <p className="text-text-secondary">{emptyMessage}</p>
        <p className="mt-6">
          <Link
            href="/hizmetler"
            className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {blog.empty.servicesLink}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
