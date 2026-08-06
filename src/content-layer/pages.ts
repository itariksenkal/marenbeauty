import { z } from 'zod';

import { parseFrontmatter, readCollection } from './load';

/**
 * Standalone editorial pages — the MDX collection behind routes that are prose
 * rather than a listing. `/hakkimizda` is the first, and the gallery's
 * introduction is the second.
 *
 * Same shape as the legal collection and for the same reason: a page whose
 * content is paragraphs belongs in MDX where the owner can edit it, not in a
 * TypeScript file where a missing comma breaks the build. What differs is that
 * these carry a `heroImageId`, because they are designed pages rather than
 * notices.
 */
export const pageFrontmatterSchema = z
  .object({
    title: z.string().min(2).max(60),
    eyebrow: z.string().min(2).max(30),
    /** Doubles as the meta description, hence the SERP-shaped bounds. */
    summary: z.string().min(60).max(165),
    /** The opening paragraph, rendered larger than the body. */
    lead: z.string().min(40),
    /** Resolved through `src/config/images.ts`. Null renders no hero. */
    heroImageId: z.string().min(1).nullable(),
  })
  .strict();

export type PageFrontmatter = z.infer<typeof pageFrontmatterSchema>;

export type EditorialPage = PageFrontmatter & {
  readonly slug: string;
  readonly body: string;
  readonly file: string;
  readonly modifiedAt: Date;
};

const pages: readonly EditorialPage[] = readCollection('pages').map((doc) => ({
  ...parseFrontmatter(pageFrontmatterSchema, doc),
  slug: doc.slug,
  body: doc.body,
  file: doc.file,
  modifiedAt: doc.modifiedAt,
}));

const bySlug = new Map(pages.map((page) => [page.slug, page]));

export function getAllEditorialPages(): readonly EditorialPage[] {
  return pages;
}

export function getEditorialPage(slug: string): EditorialPage {
  const page = bySlug.get(slug);
  if (!page) {
    throw new Error(
      `No editorial page for slug "${slug}". Expected an MDX file of that ` +
        `name in the pages collection.`,
    );
  }
  return page;
}
