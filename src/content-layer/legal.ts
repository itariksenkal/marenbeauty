import { z } from 'zod';

import { parseFrontmatter, readCollection } from './load';

/**
 * Legal documents — `content/legal/*.mdx`.
 *
 * A third collection alongside services and posts, deliberately much smaller:
 * three documents, no taxonomy, no relations, no drafts. Legal text is prose
 * with a title and a description, and inventing a richer schema for it would be
 * scaffolding nobody uses.
 *
 * The document body never names the legal entity. The data-controller block is
 * rendered by the page from `src/config/legal-entity.ts`, so the unresolved
 * state (docs/OPEN-QUESTIONS.md B2) is expressed in exactly one place rather
 * than three, and no MDX file has to carry a `{{…}}` token that the guard would
 * then have to see reach output.
 */
export const legalFrontmatterSchema = z
  .object({
    title: z.string().min(2).max(60),
    /** Doubles as the meta description, hence the SERP-shaped bounds. */
    summary: z.string().min(60).max(165),
    /** Display order in the footer and in the "other documents" block. */
    order: z.number().int().positive(),
  })
  .strict();

export type LegalFrontmatter = z.infer<typeof legalFrontmatterSchema>;

export type LegalDocument = LegalFrontmatter & {
  readonly slug: string;
  readonly body: string;
  readonly file: string;
  readonly modifiedAt: Date;
};

const documents: readonly LegalDocument[] = readCollection('legal')
  .map((doc) => ({
    ...parseFrontmatter(legalFrontmatterSchema, doc),
    slug: doc.slug,
    body: doc.body,
    file: doc.file,
    modifiedAt: doc.modifiedAt,
  }))
  .sort((a, b) => a.order - b.order);

const bySlug = new Map(documents.map((doc) => [doc.slug, doc]));

export function getAllLegalDocuments(): readonly LegalDocument[] {
  return documents;
}

/**
 * Throws on an unknown slug rather than returning undefined: a legal route
 * whose document is missing must fail static generation, not render an empty
 * page that looks like a published notice.
 */
export function getLegalDocument(slug: string): LegalDocument {
  const doc = bySlug.get(slug);
  if (!doc) {
    throw new Error(
      `No legal document for slug "${slug}". Expected content/legal/${slug}.mdx.`,
    );
  }
  return doc;
}

export function getAllLegalSlugs(): readonly string[] {
  return documents.map((doc) => doc.slug);
}
