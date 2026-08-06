'use client';

import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { createContext, useContext, useRef, type ReactNode } from 'react';

import { transforms } from '@/config/motion';
import { useMotionTier } from '@/hooks/use-motion-tier';
import { cn } from '@/lib/cn';

/**
 * Signature #2 — sticky stacked panels (docs/MOTION.md §3.2).
 *
 * Each panel sticks, then the next covers it while the outgoing one scales to
 * 0.96 and dims.
 *
 * `position: sticky` is computed BEFORE transforms, so scaling a sticky panel
 * does not break stickiness — which is why this needs no JS layout work.
 *
 * The dim is a child overlay animated via `opacity`, NOT `filter: brightness()`
 * on the panel: a filter would push the whole subtree onto its own layer.
 *
 * PROGRESS COMES FROM THE STACK, NOT THE PANEL. A sticky panel's own bounding
 * rect stops moving the moment it pins, so `useScroll({ target: panelRef })`
 * yields no progress and the panels never scale at all — which is exactly what
 * happened until a browser test measured the computed transform and found it
 * stuck at 1. The container scrolls; each panel takes its slice of that.
 */
const StackProgressContext = createContext<MotionValue<number> | null>(null);

export function StickyPanelStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  return (
    <StackProgressContext.Provider value={scrollYProgress}>
      <section ref={ref} className={cn('relative', className)}>
        {children}
      </section>
    </StackProgressContext.Provider>
  );
}

export function StickyPanel({
  children,
  index,
  total,
  className,
}: {
  children: ReactNode;
  index: number;
  total: number;
  className?: string;
}) {
  const tier = useMotionTier();
  const stackProgress = useContext(StackProgressContext);
  const fallback = useMotionValue(0);
  const progress = stackProgress ?? fallback;
  const isLast = index === total - 1;

  // The slice of the stack's scroll during which THIS panel is being covered.
  const span = 1 / total;
  const from = index * span;
  const to = (index + 1) * span;

  const scale = useTransform(progress, [from, to], [1, transforms.panelScale], {
    clamp: true,
  });
  const dim = useTransform(progress, [from, to], [0, transforms.panelDim], {
    clamp: true,
  });

  // reduced/static: a plain stacked list. Same content, same order — the
  // reading experience is identical.
  if (tier !== 'full' || !stackProgress) {
    return (
      <article
        className={cn(
          'rounded-t-panel bg-surface-raised shadow-panel',
          index > 0 && 'mt-6',
          className,
        )}
        data-panel={`${index + 1}/${total}`}
      >
        {children}
      </article>
    );
  }

  return (
    <motion.article
      className={cn(
        'sticky top-0 origin-top overflow-hidden rounded-t-panel bg-surface-raised shadow-panel',
        className,
      )}
      // The last panel never scales away — nothing covers it.
      style={isLast ? { zIndex: index } : { scale, zIndex: index }}
      data-panel={`${index + 1}/${total}`}
    >
      {children}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[var(--scrim-soft)]"
        style={{ opacity: isLast ? 0 : dim }}
      />
    </motion.article>
  );
}
