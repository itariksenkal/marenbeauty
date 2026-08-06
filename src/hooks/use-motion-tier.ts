'use client';

import { createContext, useContext } from 'react';

/**
 * Motion tiers — docs/MOTION.md §6.
 *
 *   full     — the full art direction.
 *   reduced  — prefers-reduced-motion. Final state, immediately. Grain stays.
 *   static   — low-end or data-saving. Aurora becomes a flat gradient, no
 *              pinning, no reveals, grain dropped.
 */
export type MotionTier = 'full' | 'reduced' | 'static';

export const MOTION_TIERS: readonly MotionTier[] = [
  'full',
  'reduced',
  'static',
];

export function isMotionTier(value: unknown): value is MotionTier {
  return value === 'full' || value === 'reduced' || value === 'static';
}

/**
 * Default `full`, deliberately. The tier is resolved before first paint by an
 * inline script; if that has not run, or the detection APIs are unavailable
 * (they are Chromium-only), we do not punish the browser for not reporting.
 */
export const MotionTierContext = createContext<MotionTier>('full');

export function useMotionTier(): MotionTier {
  return useContext(MotionTierContext);
}

/** True when animation should run at all. */
export function useAnimationEnabled(): boolean {
  return useMotionTier() === 'full';
}
