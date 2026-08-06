import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import matter from 'gray-matter';
import type { z } from 'zod';

/**
 * Filesystem loading and frontmatter validation.
 *
 * This module is the ONLY place that reads from `content/` (CLAUDE.md §5).
 * A validation failure throws, which fails the build during static generation —
 * that is the point. Bad frontmatter must never degrade silently at runtime.
 */

export type RawDoc = {
  readonly slug: string;
  readonly file: string;
  readonly data: unknown;
  readonly body: string;
};

export function contentDir(collection: string): string {
  return join(process.cwd(), 'content', collection);
}

/**
 * YAML parses an unquoted `2026-08-06` into a Date, not a string, which would
 * fail an ISO-date schema for a reason the author cannot see in their file.
 * Normalising here means frontmatter dates never need quoting — worth doing
 * because the owner will eventually be writing this frontmatter herself.
 */
function normaliseDates(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(normaliseDates);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        normaliseDates(v),
      ]),
    );
  }
  return value;
}

export function readCollection(collection: string): RawDoc[] {
  const dir = contentDir(collection);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((name) => name.endsWith('.mdx'))
    .sort()
    .map((name) => {
      const slug = name.replace(/\.mdx$/, '');
      const raw = readFileSync(join(dir, name), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug,
        file: `content/${collection}/${name}`,
        data: normaliseDates(data),
        body: content,
      };
    });
}

/**
 * Validate frontmatter, naming the file AND the offending field.
 *
 * A build that fails with "Invalid input" and no location is barely better than
 * not checking at all, so the message carries both.
 */
export function parseFrontmatter<T extends z.ZodType>(
  schema: T,
  doc: RawDoc,
): z.infer<T> {
  const result = schema.safeParse(doc.data);
  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    return `      ${path}: ${issue.message}`;
  });

  throw new Error(
    `Invalid frontmatter in ${doc.file}:\n${lines.join('\n')}\n\n` +
      `See docs/ARCHITECTURE.md §3 for the schema. Unknown keys are rejected ` +
      `on purpose — a typo must not silently become an empty field.`,
  );
}
