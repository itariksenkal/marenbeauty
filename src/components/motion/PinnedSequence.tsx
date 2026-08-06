'use client';

import type { MotionValue } from 'motion/react';
import { createContext, useContext, type ReactNode } from 'react';

import { useMotionTier } from '@/hooks/use-motion-tier';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import type { CssVars } from '@/lib/css-vars';

/**
 * The only place the site holds the viewport (docs/MOTION.md §5).
 * Used in EXACTLY TWO places: the hero → brand-story opening, and the process
 * section. Nowhere else.
 *
 * A tall outer element with a `position: sticky` stage inside. No JS pinning
 * library, because that would mean owning scroll:
 *   - native scroll is untouched, so the scrollbar, keyboard paging,
 *     Home/End, find-in-page and scroll restoration all behave normally;
 *   - no wheel or touchmove listener, so nothing fights iOS momentum;
 *   - remove the sticky rule and it degrades to a tall section that still
 *     reads correctly.
 *
 * `svh`, not `vh`: mobile browser chrome resizing would otherwise jump the
 * stage mid-sequence.
 *
 * Children are plain ReactNode, NOT a render prop. A function child cannot
 * cross the Server → Client boundary, so a render prop would force every
 * caller to be a Client Component. Descendants that need the scroll position
 * read `usePinnedProgress()` instead.
 */
const PinnedProgressContext = createContext<MotionValue<number> | null>(null);

/** Scroll progress 0→1 through the enclosing pinned stage, or null outside one. */
export function usePinnedProgress(): MotionValue<number> | null {
  return useContext(PinnedProgressContext);
}

export function PinnedSequence({
  children,
  distance = '300svh',
  mobileDistance = '180svh',
  className,
}: {
  children: ReactNode;
  /** Scroll distance. 300vh desktop / 180vh mobile is the house default. */
  distance?: string;
  mobileDistance?: string;
  className?: string;
}) {
  const tier = useMotionTier();
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // reduced/static get the final composition in normal flow — no pinning, no
  // scroll binding. Reduced motion is a first-class layout, not a fallback.
  if (tier !== 'full') {
    return (
      <PinnedProgressContext.Provider value={progress}>
        <div className={className}>{children}</div>
      </PinnedProgressContext.Provider>
    );
  }

  const pinnedStyle: CssVars = {
    '--pinned-distance': distance,
    '--pinned-distance-mobile': mobileDistance,
  };

  return (
    <PinnedProgressContext.Provider value={progress}>
      <div
        ref={ref}
        className={className}
        style={pinnedStyle}
        data-pinned-sequence=""
      >
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {children}
        </div>
      </div>
    </PinnedProgressContext.Provider>
  );
}
