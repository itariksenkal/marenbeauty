'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';

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
 * does not break stickiness — which is why this needs no JS layout work at all.
 *
 * The dim is a child overlay animated via `opacity`, NOT `filter: brightness()`
 * on the panel: a filter would push the whole subtree onto its own layer.
 */
export function StickyPanelStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn('relative', className)}>{children}</section>;
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
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, transforms.panelScale],
  );
  const dim = useTransform(scrollYProgress, [0, 1], [0, transforms.panelDim]);

  // reduced/static: a plain stacked list. Same content, same order — the
  // reading experience is identical.
  if (tier !== 'full') {
    return (
      <article
        className={cn(
          'rounded-t-panel bg-surface-raised shadow-panel',
          index > 0 && 'mt-6',
          className,
        )}
      >
        {children}
      </article>
    );
  }

  return (
    <motion.article
      ref={ref}
      className={cn(
        'sticky top-0 origin-top overflow-hidden rounded-t-panel bg-surface-raised shadow-panel',
        className,
      )}
      style={{ scale, zIndex: index }}
      // Last panel does not scale away — nothing covers it.
      data-panel={`${index + 1}/${total}`}
    >
      {children}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[var(--scrim-soft)]"
        style={{ opacity: index === total - 1 ? 0 : dim }}
      />
    </motion.article>
  );
}
