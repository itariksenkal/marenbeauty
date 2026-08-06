import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PostListing } from '@/components/content/PostListing';
import { JsonLd } from '@/components/seo/JsonLd';
import { blog, blogCategories, POSTS_PER_PAGE } from '@/config/blog';
import { site } from '@/config/site';
import { routeSeo } from '@/config/seo';
import { standardGraph } from '@/lib/schema/graph';
import {
  BLOG_CATEGORIES,
  getAllServices,
  getPostsByCategory,
} from '@/content-layer';
import type { BlogCategory } from '@/content-layer';
import { paginate } from '@/lib/pagination';

/**
 * A category archive — page 1.
 *
 * **All six exist from the start**, even while every one of them is empty. They
 * are the confirmed taxonomy (docs/CONTENT-PLAN.md §3), and a set of archives
 * that appears one at a time as posts are written would make the site look
 * half-built. The empty state carries the honesty instead.
 */
export function generateStaticParams() {
  return BLOG_CATEGORIES.map((slug) => ({ slug }));
}

export const dynamicParams = false;

function resolve(slug: string) {
  const category = blogCategories.find((entry) => entry.id === slug);
  if (!category) return null;
  const posts = getPostsByCategory(category.id as BlogCategory);
  // Page 1 always exists, including for an empty category.
  return { category, result: paginate(posts, 1, POSTS_PER_PAGE)! };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) return {};

  return {
    title: found.category.label,
    description: found.category.description,
    alternates: { canonical: `${site.url}/blog/kategori/${found.category.id}` },
    // Thin while empty; flips by itself once the category has a post.
    robots:
      found.result.totalItems === 0
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = resolve(slug);
  if (!found) notFound();

  const path = `/blog/kategori/${found.category.id}`;

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path,
          name: found.category.label,
          description: found.category.description,
          type: 'CollectionPage',
          trail: [
            { name: routeSeo.blog.title, path: '/blog' },
            { name: found.category.label, path },
          ],
          services: getAllServices(),
        })}
      />
      <PostListing
        eyebrow={blog.index.eyebrow}
        heading={found.category.label}
        lead={found.category.description}
        activeCategory={found.category.id}
        result={found.result}
        basePath={path}
        emptyMessage={blog.empty.category}
      />
    </>
  );
}
