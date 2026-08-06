import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PostListing } from '@/components/content/PostListing';
import { blog, blogCategories, POSTS_PER_PAGE } from '@/config/blog';
import { site } from '@/config/site';
import { getPostsByCategory } from '@/content-layer';
import { hrefForPage, pagesAfterFirst, paginate } from '@/lib/pagination';

/**
 * Category archives, pages **2 and upward**.
 *
 * Built now rather than later because the plan already overflows: fourteen of
 * the fifty posts in `docs/CONTENT-PLAN.md` §4 map to `cilt-yenileme-rehberi`,
 * which is more than one page of twelve. Adding this route after those posts
 * exist would mean changing the archive's canonical URLs — which is exactly the
 * kind of retrofit "twelve now, fifty later" is meant to avoid.
 *
 * Same convention as `/blog/sayfa/[page]`: page 1 is the bare archive, page
 * numbers start at 2, and everything ungenerated 404s.
 */
export function generateStaticParams() {
  return blogCategories.flatMap((category) =>
    pagesAfterFirst(getPostsByCategory(category.id).length, POSTS_PER_PAGE).map(
      (page) => ({ slug: category.id, page: String(page) }),
    ),
  );
}

export const dynamicParams = false;

function resolve(slug: string, rawPage: string) {
  const category = blogCategories.find((entry) => entry.id === slug);
  if (!category) return null;
  if (!/^[1-9]\d*$/.test(rawPage)) return null;
  const page = Number(rawPage);
  if (page === 1) return null; // page 1 is the bare archive

  const result = paginate(
    getPostsByCategory(category.id),
    page,
    POSTS_PER_PAGE,
  );
  return result ? { category, result } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const found = resolve(slug, page);
  if (!found) return {};

  const base = `/blog/kategori/${found.category.id}`;
  return {
    title: `${found.category.label} — ${blog.pagination.pageWord} ${found.result.page}`,
    description: found.category.description,
    alternates: {
      canonical: `${site.url}${hrefForPage(base, found.result.page)}`,
    },
  };
}

export default async function BlogCategoryPaginatedPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const found = resolve(slug, page);
  if (!found) notFound();

  return (
    <PostListing
      eyebrow={blog.index.eyebrow}
      heading={found.category.label}
      lead={found.category.description}
      activeCategory={found.category.id}
      result={found.result}
      basePath={`/blog/kategori/${found.category.id}`}
      emptyMessage={blog.empty.category}
    />
  );
}
