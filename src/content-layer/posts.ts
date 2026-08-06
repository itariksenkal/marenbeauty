import { readingMinutes } from '@/lib/reading-time';
import { compareByDateDesc } from '@/lib/date';

import { parseFrontmatter, readCollection } from './load';
import { postFrontmatterSchema, type BlogCategory, type Post } from './schemas';

/**
 * Posts, read ONCE at module scope (docs/ARCHITECTURE.md §4).
 *
 * `readingMinutes` is computed here from the body and never read from
 * frontmatter — the schema is `.strict()`, so authoring the key is an error.
 */
function load(): Post[] {
  return readCollection('blog').map((doc) => ({
    ...parseFrontmatter(postFrontmatterSchema, doc),
    slug: doc.slug,
    body: doc.body,
    file: doc.file,
    modifiedAt: doc.modifiedAt,
    readingMinutes: readingMinutes(doc.body),
  }));
}

const posts: readonly Post[] = load();

/**
 * Every post including drafts, for the integrity pass only.
 * `services.ts` owns the cross-collection check, because it is the module that
 * knows about both collections; exporting the raw list keeps the two modules
 * from importing each other in a cycle.
 */
export const postsForIntegrity: readonly Post[] = posts;

const byDate = (a: Post, b: Post) =>
  compareByDateDesc(a.publishedAt, b.publishedAt) ||
  a.slug.localeCompare(b.slug);

const bySlug = new Map(posts.map((post) => [post.slug, post]));

export type PostQuery = {
  /** Drafts are excluded unless explicitly requested. Never in production. */
  readonly includeDrafts?: boolean;
};

function visible(query?: PostQuery): readonly Post[] {
  const includeDrafts =
    query?.includeDrafts === true && process.env.NODE_ENV !== 'production';
  return includeDrafts ? posts : posts.filter((post) => !post.draft);
}

/** Newest first, slug as a stable tiebreak. */
export function getAllPosts(query?: PostQuery): readonly Post[] {
  return [...visible(query)].sort(byDate);
}

export function getPostBySlug(slug: string, query?: PostQuery): Post | null {
  const post = bySlug.get(slug);
  if (!post) return null;
  return visible(query).includes(post) ? post : null;
}

export function getPostsByService(serviceSlug: string): readonly Post[] {
  return getAllPosts().filter((post) => post.service === serviceSlug);
}

export function getPostsByCategory(category: BlogCategory): readonly Post[] {
  return getAllPosts().filter((post) => post.category === category);
}

/**
 * Same service first, then same category, then newest.
 * The post itself is always excluded.
 */
export function getRelatedPosts(post: Post, limit = 3): readonly Post[] {
  const others = getAllPosts().filter((other) => other.slug !== post.slug);
  const score = (other: Post) =>
    (other.service === post.service ? 2 : 0) +
    (other.category === post.category ? 1 : 0);
  return [...others]
    .sort((a, b) => score(b) - score(a) || byDate(a, b))
    .slice(0, limit);
}

/**
 * Slugs for `generateStaticParams`.
 *
 * `includeDrafts` is honoured only outside production (see `visible`), which is
 * what lets a draft post have a route under `next dev` and no route at all in a
 * production build — the mechanism the post-template preview relies on
 * (docs/OPEN-QUESTIONS.md G17).
 */
export function getAllPostSlugs(query?: PostQuery): readonly string[] {
  return getAllPosts(query).map((post) => post.slug);
}
