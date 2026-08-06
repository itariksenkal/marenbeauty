import { evaluate } from '@mdx-js/mdx';
import type { MDXComponents } from 'mdx/types';
import * as runtime from 'react/jsx-runtime';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

/**
 * MDX compilation.
 *
 * `next-mdx-remote` is NOT installed and must not be: it is MPL-2.0, outside
 * the licence policy (CLAUDE.md §2, docs/LICENSES.md §6). `@mdx-js/mdx`'s
 * `evaluate()` does the same job under MIT in about twenty lines — it is what
 * next-mdx-remote wraps.
 *
 * Runs in a Server Component. With every content route statically generated,
 * this executes at build time, so the `new Function` inside `evaluate` never
 * runs on a request path.
 */
const remarkPlugins = [remarkGfm];
const rehypePlugins = [
  rehypeSlug,
  // `wrap` keeps the heading text as the link, so screen readers announce the
  // heading rather than a bare "link" with no name.
  [rehypeAutolinkHeadings, { behavior: 'wrap' }] as const,
];

export async function compileMdxBody(source: string, file: string) {
  try {
    const compiled = await evaluate(source, {
      ...runtime,
      remarkPlugins,
      rehypePlugins,
    } as Parameters<typeof evaluate>[1]);
    return compiled.default as (props: {
      components?: MDXComponents;
    }) => React.JSX.Element;
  } catch (error) {
    throw new Error(
      `Failed to compile MDX in ${file}: ${(error as Error).message}`,
    );
  }
}
