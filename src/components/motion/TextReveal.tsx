'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

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
 * The text is in the DOM from the first paint and only `clip-path` and
 * `transform` change, so find-in-page locates it before it has revealed.
 *
 * TWO MODES:
 *   viewport — fires once when scrolled into view. The default.
 *   progress — driven by a scroll position passed in. Used inside a pinned
 *              stage, where the reader should set the pace rather than a timer
 *              running while the page is held still.
 */
const HIDDEN = 'inset(0 0 100% 0)';
const SHOWN = 'inset(0 0 0% 0)';

function ProgressLine({
  line,
  progress,
  from,
  to,
  className,
}: {
  line: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
  className?: string;
}) {
  const bottom = useTransform(progress, [from, to], [100, 0], { clamp: true });
  const clipPath = useTransform(bottom, (value) => `inset(0 0 ${value}% 0)`);
  const y = useTransform(progress, [from, to], ['0.36em', '0em'], {
    clamp: true,
  });

  return (
    <motion.span
      data-reveal-line=""
      className={cn('block', className)}
      style={{ clipPath, y }}
    >
      {line}
    </motion.span>
  );
}

export function TextReveal({
  lines,
  as: Tag = 'p',
  className,
  lineClassName,
  progress,
  range = [0, 1],
}: {
  lines: readonly string[];
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  className?: string;
  lineClassName?: string;
  /** Supply to drive the reveal from scroll position instead of a timer. */
  progress?: MotionValue<number>;
  /** The slice of `progress` this block occupies. */
  range?: readonly [number, number];
}) {
  const tier = useMotionTier();
  const animated = tier === 'full';

  // Beyond the cap a staggered run overruns the budget, so it reveals as one
  // block instead — six lines at 60ms plus a 320ms reveal is already ~620ms.
  const staggered = lines.length <= stagger.cap;

  if (animated && progress) {
    const start = range[0];
    const end = range[1];
    const span = (end - start) / lines.length;
    return (
      <Tag className={className}>
        {lines.map((line, index) => (
          <ProgressLine
            key={line}
            line={line}
            progress={progress}
            from={start + index * span}
            // Slight overlap, so lines flow rather than ticking over one by one.
            to={start + (index + 1) * span * 1.05}
            className={lineClassName}
          />
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <motion.span
          key={line}
          data-reveal-line=""
          className={cn('block', lineClassName)}
          initial={animated ? { clipPath: HIDDEN, y: '0.36em' } : undefined}
          whileInView={animated ? { clipPath: SHOWN, y: '0em' } : undefined}
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
