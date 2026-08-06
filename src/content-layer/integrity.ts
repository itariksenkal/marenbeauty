import { isValidSlug, slugify } from '@/lib/slug';

import type { Post, Service } from './schemas';

/**
 * Referential integrity — docs/ARCHITECTURE.md §3.4.
 *
 * Dangling references are BUILD FAILURES, not 404s in production. A service
 * that links to a service that does not exist, or a post pointing at a service
 * that was renamed, should never reach a deployment.
 *
 * This is a pure function over already-parsed documents so every check can be
 * proven by a test without touching the filesystem.
 */

export type IntegrityIssue = {
  /** Stable id, so tests can assert on the specific check that fired. */
  readonly check: string;
  readonly file: string;
  readonly message: string;
};

export type IntegrityInput = {
  readonly services: readonly Service[];
  readonly posts: readonly Post[];
  /** Ids present in src/config/images.ts. */
  readonly imageIds: readonly string[];
};

/** Internal links of one kind written in an MDX body, e.g. `/blog/<slug>`. */
function linksIn(body: string, prefix: 'blog' | 'hizmetler'): string[] {
  const found = new Set<string>();
  const pattern = new RegExp(`/${prefix}/([a-z0-9-]+)`, 'g');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}

const blogLinksIn = (body: string) => linksIn(body, 'blog');

export function checkIntegrity(input: IntegrityInput): IntegrityIssue[] {
  const { services, posts, imageIds } = input;
  const issues: IntegrityIssue[] = [];

  const serviceSlugs = new Set(services.map((s) => s.slug));
  const images = new Set(imageIds);
  const push = (check: string, file: string, message: string) =>
    issues.push({ check, file, message });

  // 1 — relatedServices must resolve to a real service file.
  for (const service of services) {
    for (const related of service.relatedServices) {
      if (!serviceSlugs.has(related)) {
        push(
          'related-service-missing',
          `content/services/${service.slug}.mdx`,
          `relatedServices references "${related}", which has no matching file.`,
        );
      }
      if (related === service.slug) {
        push(
          'related-service-missing',
          `content/services/${service.slug}.mdx`,
          `relatedServices references itself.`,
        );
      }
    }
  }

  // 2 — a post's `service` must resolve.
  for (const post of posts) {
    if (!serviceSlugs.has(post.service)) {
      push(
        'post-service-missing',
        `content/blog/${post.slug}.mdx`,
        `service: "${post.service}" has no matching service file.`,
      );
    }
  }

  // 3 — every heroImageId must exist in the image manifest.
  for (const service of services) {
    if (!images.has(service.heroImageId)) {
      push(
        'image-missing',
        `content/services/${service.slug}.mdx`,
        `heroImageId "${service.heroImageId}" is not in src/config/images.ts.`,
      );
    }
  }
  for (const post of posts) {
    if (!images.has(post.heroImageId)) {
      push(
        'image-missing',
        `content/blog/${post.slug}.mdx`,
        `heroImageId "${post.heroImageId}" is not in src/config/images.ts.`,
      );
    }
  }

  // 4 — slugs must be ASCII kebab-case. Turkish characters are folded, not
  //     dropped, so a filename with "ı" in it is a mistake, not a variant.
  for (const [kind, docs] of [
    ['services', services],
    ['blog', posts],
  ] as const) {
    for (const doc of docs) {
      if (!isValidSlug(doc.slug)) {
        push(
          'invalid-slug',
          `content/${kind}/${doc.slug}.mdx`,
          `"${doc.slug}" is not ASCII kebab-case. Fold Turkish characters: ` +
            `"Cilt Bakımı" → "cilt-bakimi".`,
        );
      }
    }
  }

  // 5 — a SERVICE filename must equal slugify(title).
  //     Services only: post slugs are deliberately shorter than their titles
  //     (docs/CONTENT-PLAN.md §4), so the same rule there would reject every
  //     planned post.
  for (const service of services) {
    const expected = slugify(service.title);
    if (expected !== service.slug) {
      push(
        'slug-title-mismatch',
        `content/services/${service.slug}.mdx`,
        `title "${service.title}" slugifies to "${expected}", but the file is ` +
          `"${service.slug}.mdx". Rename the file, or add a redirect if the ` +
          `URL is already published.`,
      );
    }
  }

  // 6 — no duplicate slugs, within or across collections.
  for (const [kind, docs] of [
    ['services', services],
    ['blog', posts],
  ] as const) {
    const seen = new Set<string>();
    for (const doc of docs) {
      if (seen.has(doc.slug)) {
        push(
          'duplicate-slug',
          `content/${kind}/${doc.slug}.mdx`,
          `Duplicate slug "${doc.slug}" in ${kind}.`,
        );
      }
      seen.add(doc.slug);
    }
  }

  // 7 — nothing published may link to a draft post. A draft is absent from
  //     generateStaticParams, so such a link is a guaranteed 404.
  const draftSlugs = new Set(posts.filter((p) => p.draft).map((p) => p.slug));
  if (draftSlugs.size > 0) {
    const published = [
      ...services.map((s) => ({
        file: `content/services/${s.slug}.mdx`,
        body: s.body,
      })),
      ...posts
        .filter((p) => !p.draft)
        .map((p) => ({ file: `content/blog/${p.slug}.mdx`, body: p.body })),
    ];
    for (const doc of published) {
      for (const linked of blogLinksIn(doc.body)) {
        if (draftSlugs.has(linked)) {
          push(
            'draft-referenced',
            doc.file,
            `links to /blog/${linked}, which is draft: true and will 404.`,
          );
        }
      }
    }
  }

  // 8 — an internal link written in a body must resolve, both kinds.
  //     `relatedServices` is checked by rule 1, but from M8 the prose itself
  //     carries contextual links (docs/CONTENT-PLAN.md §5, "Anchor text"), and
  //     those are exactly as easy to break by renaming a file. A dangling one
  //     is a guaranteed 404, so it fails the build like every other dangling
  //     reference rather than waiting to be noticed in production.
  //
  //     Widened at M10 to cover `/blog/<slug>` as well: with twelve posts
  //     cross-linking each other, a post-to-post link is now the most likely
  //     one to break. Rule 7 only catches links to a DRAFT; a link to a slug
  //     that does not exist at all was, until now, nobody's job.
  const postSlugs = new Set(posts.map((p) => p.slug));
  const allDocs = [
    ...services.map((s) => ({
      file: `content/services/${s.slug}.mdx`,
      body: s.body,
    })),
    ...posts.map((p) => ({ file: `content/blog/${p.slug}.mdx`, body: p.body })),
  ];
  for (const doc of allDocs) {
    for (const linked of linksIn(doc.body, 'hizmetler')) {
      if (!serviceSlugs.has(linked)) {
        push(
          'internal-link-missing',
          doc.file,
          `links to /hizmetler/${linked}, which has no matching service file.`,
        );
      }
    }
    for (const linked of linksIn(doc.body, 'blog')) {
      if (!postSlugs.has(linked)) {
        push(
          'internal-link-missing',
          doc.file,
          `links to /blog/${linked}, which has no matching post file.`,
        );
      }
    }
  }

  return issues;
}

/** Throws a single readable error listing every problem, not just the first. */
export function assertIntegrity(input: IntegrityInput): void {
  const issues = checkIntegrity(input);
  if (issues.length === 0) return;

  const lines = issues.map(
    (i) => `  [${i.check}] ${i.file}\n      ${i.message}`,
  );
  throw new Error(
    `Content integrity failed — ${issues.length} problem(s):\n\n${lines.join('\n')}\n\n` +
      `See docs/ARCHITECTURE.md §3.4. Dangling references are build failures ` +
      `by design; they must never become 404s in production.`,
  );
}
