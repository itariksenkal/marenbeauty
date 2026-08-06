import { compileMdxBody } from '@/content-layer';

import { Prose } from './Prose';

/**
 * Compiled MDX body, wrapped in the reading measure.
 *
 * A Server Component. `compileMdxBody` runs `@mdx-js/mdx`'s `evaluate()`, and
 * because every content route is statically generated it executes at build
 * time — the `new Function` inside `evaluate` never runs on a request path
 * (docs/ARCHITECTURE.md §4).
 *
 * Element styling lives in `Prose`, not in a component map here. One place
 * decides how a paragraph looks, whether it came from MDX or from JSX.
 */
export async function Mdx({ source, file }: { source: string; file: string }) {
  const Content = await compileMdxBody(source, file);

  return (
    <Prose>
      <Content />
    </Prose>
  );
}
