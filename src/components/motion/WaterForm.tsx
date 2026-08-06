'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

import type { CssVars } from '@/lib/css-vars';

/**
 * The water surface — the one continuous form that carries the brand story
 * down the page (docs/BRIEF.md §2, docs/MOTION.md §1).
 *
 * Never depicted. There is no wave, no shell, no blue: the sea is felt in how
 * this behaves, not in what it looks like. It is three soft warm ellipses that
 * hold still, spread, disperse into light, and settle.
 *
 * Only `transform` and `opacity` animate. The blur is set once in CSS and never
 * touched — animating a blur radius re-rasterises every frame.
 */
export function WaterForm({
  progress,
  stages,
}: {
  progress: MotionValue<number>;
  /** Stage boundaries, so the mobile sequence can compress them. */
  stages: {
    still: readonly [number, number];
    spread: readonly [number, number];
    disperse: readonly [number, number];
    settle: readonly [number, number];
  };
}) {
  const [, stillEnd] = stages.still;
  const [spreadStart, spreadEnd] = stages.spread;
  const [disperseStart, disperseEnd] = stages.disperse;
  const [, settleEnd] = stages.settle;

  // Still → spreads → disperses → settles. One shape, four states.
  const scaleX = useTransform(
    progress,
    [0, stillEnd, spreadEnd, disperseEnd, settleEnd],
    [1, 1.02, 1.8, 2.6, 2.2],
  );
  const scaleY = useTransform(
    progress,
    [0, stillEnd, spreadEnd, disperseEnd, settleEnd],
    [1, 1.01, 0.82, 0.5, 0.62],
  );
  const y = useTransform(
    progress,
    [0, spreadStart, disperseStart, settleEnd],
    ['0%', '-4%', '-16%', '-10%'],
  );
  const opacity = useTransform(
    progress,
    [0, stillEnd, spreadEnd, disperseEnd, settleEnd],
    [0.85, 0.9, 0.75, 0.28, 0.4],
  );

  // The second and third layers lag, which is what makes it read as one
  // surface breaking up rather than three shapes moving together.
  const lagScale = useTransform(scaleX, (v) => 1 + (v - 1) * 0.65);
  const lagOpacity = useTransform(opacity, (v) => v * 0.7);

  const layer: CssVars = { '--water-blur': '70px' };

  return (
    <div aria-hidden="true" className="water-form" style={layer}>
      <motion.span
        className="water-layer"
        style={{
          scaleX,
          scaleY,
          y,
          opacity,
          background:
            'radial-gradient(ellipse at center, var(--mb-rose-beige), transparent 68%)',
        }}
      />
      <motion.span
        className="water-layer"
        style={{
          scaleX: lagScale,
          scaleY,
          y,
          opacity: lagOpacity,
          background:
            'radial-gradient(ellipse at center, var(--mb-blush), transparent 62%)',
        }}
      />
      <motion.span
        className="water-layer"
        style={{
          scaleX: lagScale,
          y,
          opacity: lagOpacity,
          background:
            'radial-gradient(ellipse at center, var(--mb-champagne), transparent 58%)',
        }}
      />
    </div>
  );
}
