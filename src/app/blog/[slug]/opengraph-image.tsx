import { blogCategory } from '@/config/blog';
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/seo/og';
import { getAllPostSlugs, getPostBySlug } from '@/content-layer';

/** One card per published post. Drafts generate no page and no card. */
export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function PostOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) throw new Error(`No post for slug "${slug}".`);

  return ogImage({
    eyebrow: blogCategory(post.category).label,
    title: post.seo.title ?? post.title,
    // The one number the site publishes, and it is computed from the body
    // rather than authored — see docs/ROADMAP.md M10.
    meta: `${post.readingMinutes} dakikalık okuma`,
  });
}
