'use client';

import { motion } from 'motion/react';

import { durations, easings, seconds, stagger } from '@/config/motion';
import { useMotionTier } from '@/hooks/use-motion-tier';
import { cn } from '@/lib/cn';

/**
 * Signature #3 — line-by-line clip-path reveal (docs/MOTION.md §3.3).
 *
 * LINES ARE AUTHORED, NEVER MEASURED. `lines` is an array of strings, one per
 * visual line. There is no runtime text splitting, deliberately:
 *   - no layout thrash from measuring text;
 *   - no CLS when the webfont swaps and re-wraps;
 *   - no mid-word splits;
 *   - it renders correctly server-side, before hydration;
 *   - screen readers read the spans in order as ordinary text.
 *
 * Capped at `stagger.cap` lines: six at 60ms plus a 320ms reveal already lands
 * at ~620ms, which is the practical ceiling. Longer passages reveal as one
 * block rather than overrunning the budget.
 *
 * Fires ONCE. Re-animating text the visitor has already read is annoying, and
 * on a long page it is also wasteful.
 */
export function TextReveal({
  lines,
  as: Tag = 'p',
  className,
  lineClassName,
}: {
  lines: readonly string[];
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  className?: string;
  lineClassName?: string;
}) {
  const tier = useMotionTier();
  const animated = tier === 'full';
  const staggered = lines.length <= stagger.cap;

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <motion.span
          key={line}
          className={cn('block', lineClassName)}
          initial={
            animated
              ? { clipPath: 'inset(0 0 100% 0)', y: '0.36em' }
              : undefined
          }
          whileInView={
            animated ? { clipPath: 'inset(0 0 0% 0)', y: '0em' } : undefined
          }
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: seconds.slow,
            ease: easings.entrance,
            delay: animated && staggered ? (index * stagger.line) / 1000 : 0,
          }}
        >
          {line}
        </motion.span>
      ))}
    </Tag>
  );
}

/** Exported so the review surface can show the budget it is held to. */
export const TEXT_REVEAL_BUDGET_MS =
  stagger.cap * stagger.line + durations.slow;
