'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

import { TextReveal } from '@/components/motion/TextReveal';
import { home } from '@/config/home';
import { useMotionTier } from '@/hooks/use-motion-tier';

/**
 * Stage 3 of the pinned opening — the brand story (docs/MOTION.md §4).
 *
 * Revealed line by line, driven by SCROLL POSITION rather than a timer. Inside
 * a pinned stage a timed reveal would run while the page is held still, taking
 * the pace away from the reader; bound to progress, they set it themselves and
 * can scroll back.
 *
 * Copy is placeholder pending the owner's approval, and lives entirely in
 * `src/config/home.ts` — there is no sentence in this file.
 */
export function BrandStory({
  progress,
  range,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number];
}) {
  const tier = useMotionTier();
  const animated = tier === 'full';

  // The block itself fades in just before its lines begin, and holds. Without
  // this the story would be visibly present, but blank, through stage 2.
  const opacity = useTransform(
    progress,
    [range[0] - 0.08, range[0], range[1], range[1] + 0.12],
    [0, 1, 1, 1],
    { clamp: true },
  );

  return (
    <motion.div style={animated ? { opacity } : undefined}>
      <TextReveal
        lines={home.storyLines}
        as="p"
        progress={animated ? progress : undefined}
        range={range}
        className="max-w-display font-display text-4xl tracking-display text-balance text-text-primary"
        lineClassName="mb-2 last:mb-0"
      />
    </motion.div>
  );
}
