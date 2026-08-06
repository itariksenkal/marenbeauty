'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, type MouseEvent, type ReactNode } from 'react';

import { useMotionTier } from '@/hooks/use-motion-tier';

/**
 * Signature #5 — View Transitions (docs/MOTION.md §3.5).
 *
 * Progressive enhancement, always. Where `document.startViewTransition` is
 * absent this is a plain `next/link` and navigation is instant — no polyfill,
 * no fallback animation, no layout shift.
 *
 * THE UNIQUENESS RULE: a `view-transition-name` must be unique in the document
 * at capture time. The name is therefore applied only to the element the user
 * activated, via `data-view-transition`, and cleared afterwards. Putting the
 * name on all twenty service cards at once makes the transition silently fail.
 */
export function ViewTransitionLink({
  href,
  children,
  className,
  transitionName,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** Applied to this element only while it is the navigation source. */
  transitionName?: string;
}) {
  const router = useRouter();
  const tier = useMotionTier();

  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (tier !== 'full') return;
      if (typeof document.startViewTransition !== 'function') return;
      // Let the browser handle modified clicks — new tab, new window, download.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      if (event.button !== 0) return;

      event.preventDefault();
      const source = event.currentTarget;
      if (transitionName) source.style.viewTransitionName = transitionName;

      const transition = document.startViewTransition(() => {
        router.push(href);
      });

      // Always clear the name, success or failure — a leaked name breaks the
      // NEXT transition, which is a maddening bug to trace.
      void transition.finished.finally(() => {
        source.style.viewTransitionName = '';
      });
    },
    [href, router, tier, transitionName],
  );

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
