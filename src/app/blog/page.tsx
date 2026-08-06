import type { Metadata } from 'next';

import { PostListing } from '@/components/content/PostListing';
import { blog, POSTS_PER_PAGE } from '@/config/blog';
import { site } from '@/config/site';
import { getAllPosts } from '@/content-layer';
import { paginate } from '@/lib/pagination';

/**
 * The blog index — **page 1**, at `/blog`.
 *
 * There is deliberately no `/blog/sayfa/1`: page 1 lives here and only here
 * (`src/lib/pagination.ts`). `next.config.ts` redirects `/blog/sayfa/1` to this
 * URL permanently, so the duplicate cannot be reached by editing the address
 * bar either.
 *
 * With no posts published this renders the empty state — a real sentence, and a
 * link to the pages that do exist.
 */
export const metadata: Metadata = {
  title: blog.index.heading,
  description: blog.index.lead,
  alternates: { canonical: `${site.url}/blog` },
  /**
   * An empty listing is thin content, so it is not offered for indexing while
   * it is empty. This flips by itself the moment the first post publishes —
   * nothing to remember. Full canonical/robots handling arrives at M13; this
   * much is here because M9's own criteria are about page-1 canonicals.
   */
  robots:
    getAllPosts().length === 0 ? { index: false, follow: true } : undefined,
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  // Page 1 always exists, including for an empty collection.
  const result = paginate(posts, 1, POSTS_PER_PAGE)!;

  return (
    <PostListing
      eyebrow={blog.index.eyebrow}
      heading={blog.index.heading}
      lead={blog.index.lead}
      result={result}
      basePath="/blog"
      emptyMessage={blog.empty.all}
    />
  );
}
