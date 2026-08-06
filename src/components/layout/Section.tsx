import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { CssVars } from '@/lib/css-vars';

type SectionTone =
  | 'page'
  | 'raised'
  | 'sunken'
  | 'accent'
  | 'inverse'
  /** No background at all, so the aurora shows through. */
  | 'transparent';

type SectionRhythm = 'default' | 'tight' | 'none';

const TONE: Record<SectionTone, string> = {
  page: 'bg-surface-page text-text-primary',
  raised: 'bg-surface-raised text-text-primary',
  sunken: 'bg-surface-sunken text-text-primary',
  accent: 'bg-surface-accent text-text-primary',
  inverse: 'bg-surface-inverse text-text-on-inverse',
  transparent: 'text-text-primary',
};

const RHYTHM: Record<SectionRhythm, string> = {
  default: 'py-section-y',
  tight: 'py-section-y-tight',
  none: '',
};

/**
 * Vertical rhythm and surface tone. Every section on the site uses this, so the
 * page has one spacing system rather than per-section guesses.
 *
 * `tone` is restricted to surfaces `text-primary` is permitted on
 * (docs/DESIGN-SYSTEM.md §1.5 rule 4) — `decor` and `blush` are not offered,
 * because body text may not sit on them.
 *
 * `tone="transparent"` lets the aurora through. Only `text-primary` and
 * `text-secondary` are permitted there: at the wash's worst case `text-muted`
 * falls to 3.26:1, which is large-text only. A unit test computes this.
 *
 * `aurora` shifts `--aurora-b` / `--aurora-c` for the span of this section.
 * `--aurora-a` is never touched — it stays cream for the whole document, which
 * is what removes hard boundaries between sections (docs/DESIGN-SYSTEM.md §1.6).
 */
export function Section({
  children,
  tone = 'page',
  rhythm = 'default',
  className,
  id,
  aurora,
}: {
  children: ReactNode;
  tone?: SectionTone;
  rhythm?: SectionRhythm;
  className?: string;
  id?: string;
  aurora?: { b?: string; c?: string };
}) {
  const style: CssVars | undefined = aurora
    ? {
        ...(aurora.b ? { '--aurora-b': aurora.b } : {}),
        ...(aurora.c ? { '--aurora-c': aurora.c } : {}),
      }
    : undefined;

  return (
    <section
      id={id}
      className={cn(TONE[tone], RHYTHM[rhythm], className)}
      style={style}
    >
      {children}
    </section>
  );
}
