'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

import { useMotionTier } from '@/hooks/use-motion-tier';
import { useSmoothedProgress } from '@/hooks/use-scroll-progress';

/**
 * Signature #1 — the scroll-linked wash (docs/MOTION.md §3.1).
 *
 * The continuous gradient that removes hard section boundaries. `--aurora-a`
 * stays cream for the whole document; sections override `--aurora-b` and
 * `--aurora-c` only, so the gradient is data rather than markup.
 *
 * Performance rules that are load-bearing:
 *   - blur is set once in CSS and NEVER animated (a blur radius re-rasterises
 *     every frame);
 *   - only `transform` moves;
 *   - `contain` keeps the blur from invalidating the rest of the page;
 *   - `will-change` is dropped when the page stops scrolling, so three large
 *     composited layers are not held for the life of the page.
 *
 * This is the ONLY scroll-linked element that is smoothed. Everything else
 * stays locked to the finger — a pinned stage that lags feels broken.
 */
export function AuroraBackground() {
  const tier = useMotionTier();
  const animated = tier === 'full';

  const { scrollYProgress } = useScroll();
  const smoothed = useSmoothedProgress(scrollYProgress);

  // Small amplitudes: the wash should be felt, not watched.
  const aY = useTransform(smoothed, [0, 1], ['-10vmax', '14vmax']);
  const aX = useTransform(smoothed, [0, 1], ['-8vmax', '6vmax']);
  const bY = useTransform(smoothed, [0, 1], ['12vmax', '-16vmax']);
  const bX = useTransform(smoothed, [0, 1], ['10vmax', '-4vmax']);
  const cY = useTransform(smoothed, [0, 1], ['6vmax', '-6vmax']);
  const cScale = useTransform(smoothed, [0, 0.5, 1], [0.9, 1.25, 1]);

  const layerRef = useRef<HTMLDivElement>(null);

  // `will-change` only while actually scrolling. The aurora is fixed, so it is
  // never out of view — dropping the hint on scroll idle is the meaningful
  // equivalent of the out-of-view rule.
  useEffect(() => {
    if (!animated) return;
    const layer = layerRef.current;
    if (!layer) return;

    let idle: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      layer.style.setProperty('--aurora-will-change', 'transform');
      clearTimeout(idle);
      idle = setTimeout(() => {
        layer.style.setProperty('--aurora-will-change', 'auto');
      }, 200);
    };

    // Passive: this only reads scroll position, it never prevents anything.
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idle);
      layer.style.setProperty('--aurora-will-change', 'auto');
    };
  }, [animated]);

  const blobStyle = {
    willChange: 'var(--aurora-will-change, auto)',
  } as const;

  return (
    <div ref={layerRef} aria-hidden="true" className="aurora-layer">
      <motion.span
        className="aurora-blob"
        style={{
          ...blobStyle,
          background:
            'radial-gradient(circle, var(--aurora-b), transparent 70%)',
          top: '-10%',
          left: '-5%',
          ...(animated ? { x: aX, y: aY } : {}),
        }}
      />
      <motion.span
        className="aurora-blob"
        style={{
          ...blobStyle,
          background:
            'radial-gradient(circle, var(--aurora-c), transparent 70%)',
          top: '25%',
          right: '-15%',
          ...(animated ? { x: bX, y: bY } : {}),
        }}
      />
      <motion.span
        className="aurora-blob"
        style={{
          ...blobStyle,
          background:
            'radial-gradient(circle, var(--aurora-b), transparent 72%)',
          bottom: '-20%',
          left: '20%',
          ...(animated ? { y: cY, scale: cScale } : {}),
        }}
      />
    </div>
  );
}
