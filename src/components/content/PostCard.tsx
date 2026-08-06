import Link from 'next/link';

import { blog, blogCategory } from '@/config/blog';
import type { Post } from '@/content-layer';
import { formatDateLong } from '@/lib/date';

import { ManagedImage } from './ManagedImage';

/**
 * One post in a listing.
 *
 * A Server Component: no behaviour, so no JavaScript, and — unlike the home
 * panel list — no props crossing the server/client boundary either
 * (docs/OPEN-QUESTIONS.md G16). Whole `Post` objects are safe here precisely
 * because nothing about this ships to the browser.
 *
 * **No byline.** `author` is the literal `'PENDING'` until the owner supplies a
 * real name (docs/ARCHITECTURE.md §3.3), and an unnamed author is rendered as
 * nothing at all: no "Admin", no "Editör", no empty avatar circle. The field is
 * never read here, so a byline cannot appear by accident.
 *
 * The hover state is a §1.7 lever — a rose tint across the whole card. Area,
 * not detail.
 */
export function PostCard({ post }: { post: Post }) {
  const category = blogCategory(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-decor bg-surface-raised transition-colors hover:bg-surface-accent"
    >
      <ManagedImage
        id={post.heroImageId}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/3]"
      />
      <div className="flex flex-1 flex-col p-6">
        <p className="text-2xs tracking-eyebrow text-text-accent uppercase">
          {category.label}
        </p>
        {/*
          h2, not h3. A listing's only h1 is its page title, so a card heading
          is the next level down — an h3 here skips a level on every blog
          listing at once, which a browser test caught the moment posts existed.
          The service index differs: it has a real h2 per group above its cards.
        */}
        <h2 className="mt-3 font-display text-2xl tracking-display text-text-primary">
          {post.title}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">{post.summary}</p>
        <p className="mt-5 text-2xs text-text-muted">
          <time dateTime={post.publishedAt}>
            {formatDateLong(post.publishedAt)}
          </time>
          {' · '}
          {post.readingMinutes} {blog.post.readingSuffix}
        </p>
      </div>
    </Link>
  );
}
