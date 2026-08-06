import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import {
  blog,
  blogCategories,
  blogCategory,
  POSTS_PER_PAGE,
} from '@/config/blog';
import { getImage, images } from '@/config/images';
import {
  BLOG_CATEGORIES,
  getAllPosts,
  getAllPostSlugs,
  getPostBySlug,
  getPostsByCategory,
} from '@/content-layer';
import {
  hrefForPage,
  pageCount,
  pagesAfterFirst,
  paginate,
} from '@/lib/pagination';

/**
 * M9 — the blog system, with no published posts.
 *
 * Two things are hard to test here and both are covered deliberately:
 *
 *   1. **Pagination at a size the content does not have yet.** The maths is a
 *      pure function, so twelve and fifty are proven with synthetic arrays
 *      rather than by writing forty-nine posts. That is the whole reason it is
 *      a pure function.
 *   2. **The post template, with nothing to render.** A `draft: true` preview
 *      post gives it a route under `next dev` and none in production; the
 *      `development` Playwright project drives it. Without that, `/blog/[slug]`
 *      would generate zero pages and `npm run verify` would stay green over a
 *      completely broken template.
 */

const norm = (path: string) => path.split(sep).join('/');

const sources: { file: string; text: string }[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full))
      sources.push({ file: norm(full), text: readFileSync(full, 'utf8') });
  }
};
walk(join(process.cwd(), 'src'));

const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const read = (relative: string) =>
  stripComments(sources.find((s) => s.file.endsWith(relative))?.text ?? '');

/* ── Pagination, proven at 0, 12 and 50 ───────────────────────────────────── */

describe('pagination', () => {
  it('an empty collection is one page, not zero', () => {
    // Zero pages would make /blog unreachable at exactly the moment it needs
    // to explain itself.
    expect(pageCount(0, 12)).toBe(1);
    const result = paginate([], 1, 12);
    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
    expect(result!.totalPages).toBe(1);
    expect(result!.hasNext).toBe(false);
  });

  it.each([
    [0, 1],
    [1, 1],
    [12, 1],
    [13, 2],
    [24, 2],
    [25, 3],
    [50, 5],
  ])('%i posts is %i page(s) at twelve per page', (posts, pages) => {
    expect(pageCount(posts, 12)).toBe(pages);
  });

  it('page numbers start at 2 — /sayfa/1 is never generated', () => {
    expect(pagesAfterFirst(0, 12)).toEqual([]);
    expect(pagesAfterFirst(12, 12)).toEqual([]);
    expect(pagesAfterFirst(13, 12)).toEqual([2]);
    expect(pagesAfterFirst(50, 12)).toEqual([2, 3, 4, 5]);
  });

  it('hrefForPage cannot emit /sayfa/1, whatever it is asked', () => {
    expect(hrefForPage('/blog', 1)).toBe('/blog');
    expect(hrefForPage('/blog', 0)).toBe('/blog');
    expect(hrefForPage('/blog', 2)).toBe('/blog/sayfa/2');
    expect(hrefForPage('/blog/kategori/x', 3)).toBe('/blog/kategori/x/sayfa/3');
  });

  it('returns null for a page that does not exist', () => {
    const fifty = Array.from({ length: 50 }, (_, i) => i);
    expect(paginate(fifty, 6, 12)).toBeNull();
    expect(paginate(fifty, 0, 12)).toBeNull();
    expect(paginate(fifty, 1.5, 12)).toBeNull();
    expect(paginate([], 2, 12)).toBeNull();
  });

  it('slices the right window, and the last page is the remainder', () => {
    const fifty = Array.from({ length: 50 }, (_, i) => i);
    expect(paginate(fifty, 1, 12)!.items).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(paginate(fifty, 5, 12)!.items).toEqual([48, 49]);
    expect(paginate(fifty, 5, 12)!.hasNext).toBe(false);
    expect(paginate(fifty, 5, 12)!.hasPrevious).toBe(true);
  });

  it('the planned fifty posts fit the routes that exist', () => {
    // docs/CONTENT-PLAN.md §4 puts 14 posts in one category — more than one
    // page — which is why the category archive is paginated now rather than
    // retrofitted after those posts are written.
    expect(pagesAfterFirst(50, POSTS_PER_PAGE)).toHaveLength(4);
    expect(pagesAfterFirst(14, POSTS_PER_PAGE)).toEqual([2]);
  });

  it('rejects a page size that would divide by zero', () => {
    expect(() => pageCount(10, 0)).toThrow(/at least 1/);
  });
});

/* ── The taxonomy — docs/CONTENT-PLAN.md §3 ───────────────────────────────── */

describe('categories', () => {
  it('the config covers exactly the six schema categories', () => {
    expect(blogCategories.map((c) => c.id).sort()).toEqual(
      [...BLOG_CATEGORIES].sort(),
    );
  });

  it('every category has a label, a description and a real image', () => {
    for (const category of blogCategories) {
      expect(category.label.length, category.id).toBeGreaterThan(2);
      expect(category.description.length, category.id).toBeGreaterThan(20);
      expect(() => getImage(category.imageId)).not.toThrow();
    }
  });

  it('blog heroes are one per category, not one per post', () => {
    // Fifty posts must never require fifty manifest entries, or writing a post
    // means inventing an image.
    const blogImages = images.filter((i) => i.id.startsWith('blog-'));
    expect(blogImages).toHaveLength(blogCategories.length);
  });

  it('throws on an unknown category rather than rendering a blank', () => {
    // @ts-expect-error — deliberately outside the union.
    expect(() => blogCategory('boyle-bir-kategori-yok')).toThrow();
  });
});

/* ── Copy discipline — CLAUDE.md §9 ───────────────────────────────────────── */

describe('blog copy', () => {
  /** Every user-facing string this milestone introduces. */
  const allCopy = [
    ...Object.values(blog.index),
    ...Object.values(blog.empty),
    ...Object.values(blog.categories),
    ...Object.values(blog.pagination),
    ...Object.values(blog.post),
    ...blogCategories.flatMap((c) => [c.label, c.description]),
  ].join('\n');

  it('passes the guard, blocking and advisory tiers both', () => {
    const found = scanText(allCopy, { file: 'src/config/blog.ts' });
    expect(found.map((v) => `${v.rule}: ${v.matched}`)).toEqual([]);
  });

  it('promises no date and no schedule', () => {
    // An empty state that says "yakında" or names a month is a commitment the
    // business has not made.
    expect(allCopy).not.toMatch(/20\d{2}/);
    expect(allCopy).not.toMatch(
      /\b(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\b/i,
    );
    expect(allCopy).not.toMatch(/\d+\s*(gün|hafta|ay)\b/i);
  });

  it('names no author, anywhere', () => {
    expect(allCopy).not.toMatch(/yazar|editör|admin/i);
  });

  it('the empty states are sentences, not labels', () => {
    for (const message of [blog.empty.all, blog.empty.category]) {
      expect(message.length).toBeGreaterThan(40);
      expect(message.trim().endsWith('.')).toBe(true);
    }
  });

  it('no blog component or route contains a Turkish sentence', () => {
    const turkishSentence = /['"`][^'"`\n]*\s(bir|ve|için|ile)\s[^'"`\n]*['"`]/;
    const offenders = sources
      .filter(
        (s) =>
          s.file.includes('src/app/blog/') ||
          s.file.includes('src/components/content/'),
      )
      .filter((s) => turkishSentence.test(stripComments(s.text)))
      .map((s) => s.file);
    expect(offenders).toEqual([]);
  });
});

/* ── Drafts — the M9 acceptance criterion, with something to prove it on ──── */

describe('drafts', () => {
  const PREVIEW = 'sablon-onizleme';

  it('the preview post exists and is a draft', () => {
    const preview = getPostBySlug(PREVIEW, { includeDrafts: true });
    expect(preview).not.toBeNull();
    expect(preview!.draft).toBe(true);
  });

  it('is absent from every published listing', () => {
    expect(getAllPosts().map((p) => p.slug)).not.toContain(PREVIEW);
    expect(
      getPostsByCategory('cilt-bakimi-rehberi').map((p) => p.slug),
    ).not.toContain(PREVIEW);
    expect(getAllPostSlugs()).not.toContain(PREVIEW);
    expect(getPostBySlug(PREVIEW)).toBeNull();
  });

  it('is reachable only when drafts are explicitly requested', () => {
    expect(getAllPostSlugs({ includeDrafts: true })).toContain(PREVIEW);
  });

  it('carries no byline of its own', () => {
    const preview = getPostBySlug(PREVIEW, { includeDrafts: true })!;
    expect(preview.author).toBe('PENDING');
  });

  it('there are no published posts yet — the blog arrives at M10', () => {
    expect(getAllPosts()).toEqual([]);
  });
});

/* ── The post template ────────────────────────────────────────────────────── */

describe('post template', () => {
  const page = read('app/blog/[slug]/page.tsx');

  it('never reads the author field', () => {
    // Not "renders it conditionally" — never reads it. A byline cannot appear
    // by accident, and adding one later is a deliberate edit.
    expect(page).not.toMatch(/post\.author/);
  });

  it('renders exactly one call to action, to /iletisim', () => {
    const links = page.match(/href="\/iletisim"/g) ?? [];
    expect(links).toHaveLength(1);
  });

  it('does not also render the shared ContactCta — that would be two', () => {
    expect(page).not.toContain('ContactCta');
  });

  it('implements every block of the §6 structure', () => {
    for (const marker of [
      'blog.post.keyPoints',
      'blog.post.faq',
      'blog.post.relatedService',
      'blog.post.relatedPosts',
      'blog.post.ctaLabel',
    ]) {
      expect(page, marker).toContain(marker);
    }
  });

  it('includes drafts in its params only via the query, never unconditionally', () => {
    expect(page).toContain('getAllPostSlugs({ includeDrafts: true })');
    // The content layer is what makes that safe in production.
    expect(read('content-layer/posts.ts')).toMatch(
      /includeDrafts === true && process\.env\.NODE_ENV !== 'production'/,
    );
  });
});

/* ── Route-shape guards ───────────────────────────────────────────────────── */

describe('route shape', () => {
  it('no post slug may collide with a listing segment', () => {
    // /blog/sayfa and /blog/kategori are static segments; a post file named
    // sayfa.mdx would be unreachable and confusing rather than an error.
    const reserved = new Set(['sayfa', 'kategori']);
    for (const slug of getAllPostSlugs({ includeDrafts: true })) {
      expect(reserved.has(slug), slug).toBe(false);
    }
  });

  it('page 1 redirects rather than 404s, in both listings', () => {
    const config = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
    expect(config).toContain("source: '/blog/sayfa/1'");
    expect(config).toContain("source: '/blog/kategori/:slug/sayfa/1'");
  });
});
