'use client';

import { useMotionValue, useMotionValueEvent } from 'motion/react';
import { useState } from 'react';

import { Container } from '@/components/layout/Container';
import {
  PinnedSequence,
  usePinnedProgress,
} from '@/components/motion/PinnedSequence';
import { ExperienceSteps } from '@/components/sections/ExperienceSteps';
import { experience } from '@/config/experience';
import { home } from '@/config/home';

/**
 * The second — and last — pinned section on the site (docs/MOTION.md §2.6).
 *
 * Renders nothing while `experience.steps` is empty. It is not empty any more,
 * but the branch stays: the steps are placeholder copy pending the owner's
 * words (docs/OPEN-QUESTIONS.md C11), and emptying the array must still remove
 * the section with no component edit.
 *
 * The scroll binding only ever changes **opacity**. Every step is in the DOM
 * from first paint and none is hidden, so find-in-page locates all four and a
 * reader who never scrolls still gets the whole sequence. At the reduced and
 * static tiers `PinnedSequence` drops the pinning and `activeIndex` stays
 * undefined, so the composition is simply the finished list.
 */
function ProgressiveSteps() {
  const progress = usePinnedProgress();
  // A stand-in for the case where this renders outside a pinned stage. The
  // hook needs a MotionValue every render, and a conditional hook call is not
  // an option — so the fallback is created unconditionally and simply never
  // changes.
  const fallback = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(progress ?? fallback, 'change', (value: number) => {
    const count = experience.steps.length;
    // The last step holds the tail of the sequence rather than flicking past.
    const next = Math.min(count - 1, Math.floor(value * count));
    setActiveIndex(next);
  });

  return <ExperienceSteps activeIndex={activeIndex} />;
}

export function ExperienceProcess() {
  if (experience.steps.length === 0) return null;

  return (
    <PinnedSequence distance="260svh" mobileDistance="170svh">
      <div className="flex h-full items-center">
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {home.sections.experienceEyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-display text-text-primary">
            {home.sections.experienceHeading}
          </h2>
          <div className="mt-10">
            <ProgressiveSteps />
          </div>
        </Container>
      </div>
    </PinnedSequence>
  );
}
