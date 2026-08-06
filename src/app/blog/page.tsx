import type { Metadata } from 'next';

import { PostListing } from '@/components/content/PostListing';
import { JsonLd } from '@/components/seo/JsonLd';
import { blog, POSTS_PER_PAGE } from '@/config/blog';
import { routeSeo } from '@/config/seo';
import { blogNode, standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import { getAllPosts, getAllServices } from '@/content-layer';
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
/**
 * An empty listing is thin content, so it is not offered for indexing while it
 * is empty. That flips by itself the moment the first post publishes — nothing
 * to remember.
 */
export const metadata: Metadata = pageMetadata({
  title: routeSeo.blog.title,
  description: routeSeo.blog.description,
  path: '/blog',
  noIndex: getAllPosts().length === 0,
});

export default function BlogIndexPage() {
  const posts = getAllPosts();
  // Page 1 always exists, including for an empty collection.
  const result = paginate(posts, 1, POSTS_PER_PAGE)!;

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: '/blog',
          name: routeSeo.blog.title,
          description: routeSeo.blog.description,
          type: 'CollectionPage',
          trail: [{ name: routeSeo.blog.title, path: '/blog' }],
          services: getAllServices(),
          extra: [blogNode('/blog')],
        })}
      />
      <PostListing
        eyebrow={blog.index.eyebrow}
        heading={blog.index.heading}
        lead={blog.index.lead}
        result={result}
        basePath="/blog"
        emptyMessage={blog.empty.all}
      />
    </>
  );
}
