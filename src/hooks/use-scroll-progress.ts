'use client';

import { useScroll, useSpring, type MotionValue } from 'motion/react';
import { useRef, type RefObject } from 'react';

import { durations } from '@/config/motion';

/**
 * Scroll progress 0→1 across a target element.
 *
 * Native scrolling is never touched — only animation *progress* is derived
 * from scroll position (docs/MOTION.md §2.3). There is no wheel or touchmove
 * listener anywhere in this codebase, and a test asserts that.
 */
export function useScrollProgress<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  progress: MotionValue<number>;
} {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  return { ref, progress: scrollYProgress };
}

/**
 * Smoothed progress, for the aurora only.
 *
 * Everything else stays locked to the finger: a pinned stage that lags feels
 * broken. Tuned to settle within --duration-settle (200ms).
 */
export function useSmoothedProgress(progress: MotionValue<number>) {
  return useSpring(progress, {
    stiffness: 220,
    damping: 34,
    mass: 0.55,
    restDelta: 0.001,
    // Documented here so the budget is visible at the call site.
    // settle target: durations.settle ms
  });
}

export const SETTLE_MS = durations.settle;
