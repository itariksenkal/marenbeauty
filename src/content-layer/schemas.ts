import { z } from 'zod';

/**
 * Frontmatter schemas — docs/ARCHITECTURE.md §3.1–§3.3.
 *
 * Every schema is `.strict()`. Unknown keys are rejected, which does two jobs:
 * it catches typos (`sumary:`) that would otherwise silently produce an empty
 * field, and it enforces that computed values are never authored —
 * `readingMinutes` in a post's frontmatter is an error, not an override.
 */

export const SERVICE_GROUPS = [
  'cilt-bakimi',
  'epilasyon',
  'cilt-yenileme',
  'kas-kirpik',
  'ozel-paket',
] as const;
export type ServiceGroup = (typeof SERVICE_GROUPS)[number];

export const BLOG_CATEGORIES = [
  'cilt-bakimi-rehberi',
  'cilt-yenileme-rehberi',
  'epilasyon-rehberi',
  'cilt-ihtiyaclari',
  'kas-kirpik-rehberi',
  'ozel-gun-ve-mevsim',
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const POST_INTENTS = [
  'informational',
  'commercial',
  'transactional',
] as const;

/** Length caps mirror docs/SEO.md §1 — a title over 60 chars is truncated in SERPs. */
const seoSchema = z
  .object({
    title: z.string().max(60).nullable(),
    description: z.string().max(165).nullable(),
  })
  .strict();

export const serviceFrontmatterSchema = z
  .object({
    title: z.string().min(2),
    eyebrow: z.string().nullable(),
    /** Doubles as the meta description, hence the SERP-shaped bounds. */
    summary: z.string().min(60).max(165),
    group: z.enum(SERVICE_GROUPS),
    order: z.number().int(),
    heroImageId: z.string().min(1),
    /**
     * Ruled: publish no durations (docs/OPEN-QUESTIONS.md C4). Stays `null`
     * on every service and renders nothing — the page structure has no "Süre"
     * block at all. Kept in the schema so the decision is visible rather than
     * merely absent.
     */
    durationLabel: z.string().nullable(),
    suitableFor: z.array(z.string()).max(6),
    /** What happens in the room. 2–6 steps. */
    steps: z
      .array(z.object({ title: z.string(), body: z.string() }).strict())
      .min(2)
      .max(6),
    aftercare: z.array(z.string()).max(6),
    faq: z
      .array(z.object({ question: z.string(), answer: z.string() }).strict())
      .max(8),
    relatedServices: z.array(z.string()).max(4),
    seo: seoSchema,
  })
  .strict();

export const postFrontmatterSchema = z
  .object({
    title: z.string().min(10).max(70),
    summary: z.string().min(80).max(165),
    publishedAt: z.iso.date(),
    updatedAt: z.iso.date().nullable(),
    category: z.enum(BLOG_CATEGORIES),
    tags: z.array(z.string()).max(5),
    /** Slug of the service this post maps to. Every post maps to exactly one. */
    service: z.string().min(1),
    /**
     * The "Kısaca" block — docs/CONTENT-PLAN.md §6. 3–5 scannable bullets.
     *
     * Structured rather than written into the body so the template places it
     * consistently, and so it cannot drift into a second, longer conclusion.
     * May be empty; an empty list renders nothing at all.
     */
    keyPoints: z.array(z.string()).max(5),
    /**
     * SSS — up to 4 genuine questions. Structured for the same reason the
     * service `faq` is: `FAQPage` JSON-LD at M13 needs question/answer pairs,
     * not headings parsed back out of prose.
     */
    faq: z
      .array(z.object({ question: z.string(), answer: z.string() }).strict())
      .max(4),
    /**
     * The literal 'PENDING' until the owner supplies a real name
     * (docs/OPEN-QUESTIONS.md). This makes a fabricated byline a TYPE ERROR
     * rather than something review has to catch.
     */
    author: z.literal('PENDING'),
    heroImageId: z.string().min(1),
    keyword: z.string().min(1),
    intent: z.enum(POST_INTENTS),
    draft: z.boolean().default(false),
    seo: seoSchema,
  })
  .strict();

export type ServiceFrontmatter = z.infer<typeof serviceFrontmatterSchema>;
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export type Service = ServiceFrontmatter & {
  readonly slug: string;
  readonly body: string;
  /** Source-file mtime, for the sitemap's `lastModified`. */
  readonly modifiedAt: Date;
  /**
   * Repo-relative source path, e.g. `content/services/cilt-bakimi.mdx`.
   *
   * Carried on the document so a consumer that needs to NAME the file — an MDX
   * compile error, say — never has to rebuild the path from the slug. Nothing
   * outside `src/content-layer/` may write a path under `content/`
   * (CLAUDE.md §5), and a unit test enforces that; this is how the rule stays
   * satisfiable without weakening it.
   */
  readonly file: string;
};

export type Post = PostFrontmatter & {
  readonly slug: string;
  readonly body: string;
  readonly file: string;
  /** Source-file mtime. Posts prefer their authored dates; this is a fallback. */
  readonly modifiedAt: Date;
  /** Computed from the body. Never authored — `.strict()` rejects the key. */
  readonly readingMinutes: number;
};
