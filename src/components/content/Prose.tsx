import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Typographic rhythm for long-form content — docs/DESIGN-SYSTEM.md §2.4.
 *
 * The measure is `max-w-reading` (68ch). NOT `max-w-prose`: Tailwind ships a
 * static 65ch utility of that name which `--container-*: initial` does not
 * clear, so a token called `prose` is silently shadowed. Verified in the built
 * CSS; the token was renamed for this reason.
 *
 * Element styling is done with descendant variants rather than a typography
 * plugin, so every value stays a token. The selectors are arbitrary; the spacing,
 * colour and type they apply are not (CLAUDE.md §14).
 *
 * Heading anchors come from `rehype-autolink-headings` with `behavior: 'wrap'`,
 * so the heading text itself is the link. They are deliberately NOT underlined —
 * only links inside paragraphs and list items are, since those are the ones a
 * reader must be able to distinguish from surrounding text (CLAUDE.md §16, and
 * §1.5 rule 7: colour is never the only signal).
 */
export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-reading text-text-secondary',
        '[&>*+*]:mt-6',
        '[&_p]:text-base',
        '[&_h2]:mt-16 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-display [&_h2]:text-text-primary',
        '[&_h3]:mt-12 [&_h3]:font-display [&_h3]:text-xl [&_h3]:tracking-display [&_h3]:text-text-primary',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_li+li]:mt-2',
        '[&_strong]:text-text-primary',
        '[&_p_a]:text-text-accent [&_p_a]:underline [&_p_a]:decoration-1 [&_p_a]:underline-offset-4',
        '[&_li_a]:text-text-accent [&_li_a]:underline [&_li_a]:decoration-1 [&_li_a]:underline-offset-4',
        '[&_li_a:hover]:decoration-2 [&_p_a:hover]:decoration-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
