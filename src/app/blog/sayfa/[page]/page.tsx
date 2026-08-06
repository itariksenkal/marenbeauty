import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PostListing } from '@/components/content/PostListing';
import { blog, POSTS_PER_PAGE } from '@/config/blog';
import { site } from '@/config/site';
import { getAllPosts } from '@/content-layer';
import { hrefForPage, pagesAfterFirst, paginate } from '@/lib/pagination';

/**
 * Blog pages **2 and upward**.
 *
 * `pagesAfterFirst` starts at 2, so `/blog/sayfa/1` is never generated, and
 * `dynamicParams = false` turns every ungenerated page number into a 404 rather
 * than an empty grid. With no posts published this route produces no pages at
 * all — correct, and it is the reason the empty case is worth asserting.
 *
 * Each page is **self-canonical**: page 2 is its own set of results, not a
 * variant of page 1, so pointing its canonical at `/blog` would ask search
 * engines to drop it.
 */
export function generateStaticParams() {
  return pagesAfterFirst(getAllPosts().length, POSTS_PER_PAGE).map((page) => ({
    page: String(page),
  }));
}

export const dynamicParams = false;

/** Shared by the metadata and the page, so they cannot disagree. */
function resolve(raw: string) {
  const page = Number(raw);
  // Reject "01", "2.0", "-2" before they reach paginate().
  if (!/^[1-9]\d*$/.test(raw)) return null;
  if (page === 1) return null; // page 1 is /blog, never here
  return paginate(getAllPosts(), page, POSTS_PER_PAGE);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const result = resolve(page);
  if (!result) return {};

  return {
    title: `${blog.index.heading} — ${blog.pagination.pageWord} ${result.page}`,
    description: blog.index.lead,
    alternates: {
      canonical: `${site.url}${hrefForPage('/blog', result.page)}`,
    },
  };
}

export default async function BlogPaginatedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const result = resolve(page);
  if (!result) notFound();

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
