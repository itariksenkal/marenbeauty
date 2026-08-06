'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { easings, seconds, transforms } from '@/config/motion';
import { cn } from '@/lib/cn';
import { useMotionTier } from '@/hooks/use-motion-tier';

/**
 * Signature #4 — image reveal (docs/MOTION.md §3.4).
 *
 * Frame wipes open with a `clip-path` inset while the inner element scales
 * 1.12 → 1. The inner scale is what gives the wipe its weight; the clip alone
 * reads as a curtain.
 *
 * The `round` value is identical at both ends so `inset()` interpolates
 * cleanly. Layout is reserved by the caller (width/height from the image
 * manifest), so the reveal can never cause CLS.
 *
 * Uses the 400ms ceiling deliberately — this is the slowest thing on the site.
 */
export function ImageReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const tier = useMotionTier();
  const animated = tier === 'full';

  if (!animated) {
    return (
      <div className={cn('overflow-hidden rounded-xl', className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn('overflow-hidden rounded-xl', className)}
      initial={{ clipPath: 'inset(100% 0 0 0 round var(--radius-xl))' }}
      whileInView={{ clipPath: 'inset(0% 0 0 0 round var(--radius-xl))' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: seconds.slowest, ease: easings.water }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: transforms.imageScale }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: seconds.slowest, ease: easings.water }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
