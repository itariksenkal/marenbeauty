import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Faq } from '@/components/content/Faq';
import { ManagedImage } from '@/components/content/ManagedImage';
import { Mdx } from '@/components/content/Mdx';
import { RelatedPosts } from '@/components/content/RelatedPosts';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { blog, blogCategory } from '@/config/blog';
import { getImage } from '@/config/images';
import { absoluteUrl, routeSeo } from '@/config/seo';
import {
  blogPostingNode,
  faqPageNode,
  standardGraph,
} from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import {
  getAllPostSlugs,
  getAllServices,
  getPostBySlug,
  getRelatedPosts,
  getServiceBySlug,
} from '@/content-layer';
import { formatDateLong } from '@/lib/date';

/**
 * Post detail — the §6 structure of docs/CONTENT-PLAN.md.
 *
 * Blocks in order: `h1`, lead, hero, body, "Kısaca", SSS, the mapped service,
 * related posts, and **exactly one** call to action. Every block after the body
 * is conditional on having data, so a post without an FAQ shows no FAQ heading.
 *
 * NO BYLINE. `author` is the literal `'PENDING'` and this template never reads
 * it — not as a name, not as an initial, not as an empty avatar. When the owner
 * supplies a real name the schema widens in one place and the byline is added
 * here deliberately, rather than appearing because a placeholder was already
 * wired up.
 *
 * ONE CTA. `docs/CONTENT-PLAN.md` §5 says one link to `/iletisim` per post, one
 * and not two, which is why this page does not also render the shared
 * `ContactCta` section the way the service pages do.
 *
 * DRAFTS. `getAllPostSlugs({ includeDrafts: true })` is honoured only outside
 * production — see `visible()` in the content layer — so a `draft: true` post
 * has a route under `next dev` and no route at all in a production build. That
 * is what lets this template be reviewed and browser-tested before the first
 * real post exists (docs/OPEN-QUESTIONS.md G17).
 */
export function generateStaticParams() {
  return getAllPostSlugs({ includeDrafts: true }).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, { includeDrafts: true });
  if (!post) return {};

  return pageMetadata({
    title: post.seo.title ?? post.title,
    description: post.seo.description ?? post.summary,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
    // A draft is reachable in development only, but say so anyway: a preview
    // URL that leaks must never be indexable.
    noIndex: post.draft,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug, { includeDrafts: true });
  if (!post) notFound();

  const category = blogCategory(post.category);
  const service = getServiceBySlug(post.service);
  const related = getRelatedPosts(post, 3);

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: `/blog/${post.slug}`,
          name: post.title,
          description: post.summary,
          type: 'ItemPage',
          trail: [
            { name: routeSeo.blog.title, path: '/blog' },
            {
              name: category.label,
              path: `/blog/kategori/${category.id}`,
            },
            { name: post.title, path: `/blog/${post.slug}` },
          ],
          services: getAllServices(),
          extra: [
            blogPostingNode(post, absoluteUrl(getImage(post.heroImageId).src)),
            faqPageNode(`/blog/${post.slug}`, post.faq),
          ],
        })}
      />
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-champagne-light)', c: 'var(--mb-nude)' }}
      >
        <Container>
          <p>
            <Link
              href="/blog"
              className="text-sm text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {blog.post.backToIndex}
            </Link>
          </p>

          <p className="mt-10">
            <Link
              href={`/blog/kategori/${category.id}`}
              className="text-xs tracking-eyebrow text-text-accent uppercase"
            >
              {category.label}
            </Link>
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {post.title}
          </h1>

          {/* Date and reading time. No author — see the note above. */}
          <p className="mt-6 text-sm text-text-muted">
            <time dateTime={post.publishedAt}>
              {formatDateLong(post.publishedAt)}
            </time>
            {post.updatedAt ? (
              <>
                {' · '}
                {blog.post.updatedPrefix}{' '}
                <time dateTime={post.updatedAt}>
                  {formatDateLong(post.updatedAt)}
                </time>
              </>
            ) : null}
            {' · '}
            {post.readingMinutes} {blog.post.readingSuffix}
          </p>

          <p className="mt-6 max-w-lead text-lg text-text-secondary">
            {post.summary}
          </p>

          <ManagedImage
            id={post.heroImageId}
            sizes="(min-width: 1200px) 1200px, 100vw"
            priority
            className="mt-12 aspect-[16/9] rounded-xl"
            imageClassName="rounded-xl"
          />
        </Container>
      </Section>

      <Section tone="raised" rhythm="tight">
        <Container>
          {/* `post.file`, not a path built here — CLAUDE.md §5. */}
          <Mdx source={post.body} file={post.file} />

          {post.keyPoints.length > 0 ? (
            <section
              aria-labelledby="kisaca"
              className="mt-16 max-w-reading rounded-xl bg-surface-accent p-8"
            >
              <h2
                id="kisaca"
                className="font-display text-xl tracking-display text-text-primary"
              >
                {blog.post.keyPoints}
              </h2>
              <ul className="mt-4 list-disc pl-5">
                {post.keyPoints.map((point) => (
                  <li key={point} className="mt-2 text-text-secondary">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-16">
            <Faq items={post.faq} title={blog.post.faq} />
          </div>
        </Container>
      </Section>

      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-rose-beige)' }}
      >
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            {service ? (
              <nav aria-labelledby="ilgili-hizmet">
                <h2
                  id="ilgili-hizmet"
                  className="font-display text-2xl tracking-display text-text-primary"
                >
                  {blog.post.relatedService}
                </h2>
                <p className="mt-6">
                  <Link
                    href={`/hizmetler/${service.slug}`}
                    className="flex items-baseline justify-between gap-4 border-b border-border-decor py-3 text-text-primary transition-colors hover:bg-surface-decor/40"
                  >
                    <span>{service.title}</span>
                    <span aria-hidden="true" className="text-text-accent">
                      →
                    </span>
                  </Link>
                </p>
              </nav>
            ) : null}

            <RelatedPosts posts={related} title={blog.post.relatedPosts} />
          </div>

          {/*
            Rendered from config on every post (CLAUDE.md §9). Not written into
            the MDX bodies: twelve copies of a compliance sentence is twelve
            chances for it to drift.
          */}
          <p className="mt-16 max-w-reading text-sm text-text-muted">
            {blog.post.disclaimer}
          </p>

          {/* The single conversion point. Exactly one link to /iletisim. */}
          <div className="mt-20 max-w-reading rounded-xl border border-border-decor bg-surface-raised p-8">
            <h2 className="font-display text-2xl tracking-display text-text-primary">
              {blog.post.ctaHeading}
            </h2>
            <p className="mt-4 text-text-secondary">{blog.post.ctaBody}</p>
            <p className="mt-6">
              <Link
                href="/iletisim"
                className="inline-block rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent transition-colors hover:bg-accent-solid-hover"
              >
                {blog.post.ctaLabel}
              </Link>
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
