import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { home } from '@/config/home';
import type { Post } from '@/content-layer/schemas';
import { formatDateLong } from '@/lib/date';

/**
 * The three latest posts.
 *
 * Renders nothing when there are none — no empty grid, no "yakında yazılar".
 *
 * A Server Component: no behaviour, so no JavaScript. The hover state is the
 * §1.7 lever here — a rose tint across a whole card, which is area rather than
 * detail.
 */
export function BlogTeaser({ posts }: { posts: readonly Post[] }) {
  const latest = posts.slice(0, 3);
  if (latest.length === 0) return null;

  return (
    <Section
      tone="transparent"
      aurora={{ b: 'var(--mb-champagne-light)', c: 'var(--mb-nude)' }}
    >
      <Container>
        <p className="text-xs tracking-eyebrow text-text-accent uppercase">
          {home.sections.blogEyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl tracking-display text-text-primary">
          {home.sections.blogHeading}
        </h2>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {latest.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-xl border border-border-decor bg-surface-raised p-6 transition-colors hover:bg-surface-accent"
              >
                <p className="text-xs text-text-muted">
                  <time dateTime={post.publishedAt}>
                    {formatDateLong(post.publishedAt)}
                  </time>
                  {' · '}
                  {post.readingMinutes} dk
                </p>
                <h3 className="mt-3 font-display text-2xl tracking-display text-text-primary">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm text-text-secondary">
                  {post.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10">
          <Link
            href="/blog"
            className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {home.sections.blogLink}
          </Link>
        </p>
      </Container>
    </Section>
  );
}
