'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

import { Container } from '@/components/layout/Container';
import { ImageReveal } from '@/components/motion/ImageReveal';
import {
  PinnedSequence,
  usePinnedProgress,
} from '@/components/motion/PinnedSequence';
import { WaterForm } from '@/components/motion/WaterForm';
import { BrandStory } from '@/components/sections/BrandStory';
import { home } from '@/config/home';
import { site } from '@/config/site';
import { useIsMobileViewport } from '@/hooks/use-media-query';
import { useMotionTier } from '@/hooks/use-motion-tier';

/**
 * The pinned opening — the first thing anyone sees (docs/MOTION.md §4).
 *
 *   1 still        oversized "Maren", the surface held, one positioning line
 *   2 contraction  the wordmark hands off to the header; the water spreads
 *   3 story        the brand lines reveal, driven by scroll rather than a timer
 *   4 dispersal    the surface breaks into light; the venue image opens
 *   5 release      settles, and the pin lets go
 *
 * On mobile stages 2 and 3 overlap: the wordmark contracts while the first
 * lines reveal, so the sequence fits 180svh without losing a beat.
 *
 * Every sentence on this screen comes from `src/config/home.ts` and is
 * placeholder pending the owner's approval. Nothing here asserts a fact about
 * the business.
 */

/** Stage boundaries as fractions of the pinned scroll distance. */
const DESKTOP = {
  still: [0, 0.18],
  spread: [0.18, 0.42],
  story: [0.42, 0.72],
  disperse: [0.72, 0.92],
  settle: [0.92, 1],
} as const;

const MOBILE = {
  still: [0, 0.14],
  spread: [0.14, 0.34],
  // Overlaps `spread` on purpose — this is the merge.
  story: [0.28, 0.66],
  disperse: [0.66, 0.9],
  settle: [0.9, 1],
} as const;

/**
 * Marks stages not yet reached as `inert`: nothing inside them is focusable or
 * announced. `inert` does NOT hide text from find-in-page, so the copy stays
 * findable before it reveals — which is the point.
 *
 * Module-level and imperative, deliberately. The server cannot know the tier,
 * so it renders as if `full`; state-driven `inert` would ship in the HTML and a
 * reduced-motion visitor would receive inert content until hydration corrected
 * it. Toggling after mount means the markup they receive never had it.
 */
function syncInert(
  refs: {
    story: RefObject<HTMLDivElement | null>;
    venue: RefObject<HTMLDivElement | null>;
  },
  animated: boolean,
  stages: {
    story: readonly [number, number];
    disperse: readonly [number, number];
  },
  value: number,
) {
  refs.story.current?.toggleAttribute(
    'inert',
    animated && value < stages.story[0],
  );
  refs.venue.current?.toggleAttribute(
    'inert',
    animated && value < stages.disperse[0],
  );
}

/** Restores the default so every route without a hero shows its wordmark. */
function resetHandoff() {
  const root = document.documentElement;
  root.style.setProperty('--hero-handoff', '1');
  root.dataset.heroHandoff = 'done';
}

function Stage() {
  const pinnedProgress = usePinnedProgress();
  const tier = useMotionTier();
  const isMobile = useIsMobileViewport();

  // Hooks must run unconditionally, and `useTransform` needs a real MotionValue.
  const fallback = useMotionValue(0);
  const progress = pinnedProgress ?? fallback;

  const animated = tier === 'full' && pinnedProgress !== null;
  const stages = isMobile ? MOBILE : DESKTOP;

  const storyRef = useRef<HTMLDivElement>(null);
  const venueRef = useRef<HTMLDivElement>(null);

  /**
   * The wordmark handoff — a CROSS-FADE BETWEEN TWO ELEMENTS, never a DOM move.
   * The hero wordmark and the header wordmark are separate; neither travels
   * into the other's position. That keeps the header a plain sticky element
   * with no JS-driven layout, and a mid-page refresh lands in the right state
   * rather than mid-flight.
   *
   * Published as a CSS variable on <html> rather than through React context,
   * so `SiteHeader` needs no knowledge of the hero at all.
   */
  const handoff = useTransform(
    progress,
    [stages.spread[0], stages.spread[1]],
    [0, 1],
    {
      clamp: true,
    },
  );

  useMotionValueEvent(handoff, 'change', (value) => {
    if (!animated) return;
    const root = document.documentElement;
    root.style.setProperty('--hero-handoff', String(value));
    root.dataset.heroHandoff = value < 0.5 ? 'pending' : 'done';
  });

  // Seed from the CURRENT scroll position, so refreshing halfway through the
  // sequence is correct rather than starting from zero.
  useEffect(() => {
    if (!animated) {
      resetHandoff();
      // Clear inert too. The server renders as if `full`, so a brief full-tier
      // client render can set it before the tier resolves to reduced — and
      // then nothing would ever take it off, leaving content inert for exactly
      // the visitor who must not get it.
      syncInert({ story: storyRef, venue: venueRef }, false, stages, 1);
      return;
    }
    const value = handoff.get();
    const root = document.documentElement;
    root.style.setProperty('--hero-handoff', String(value));
    root.dataset.heroHandoff = value < 0.5 ? 'pending' : 'done';
    syncInert(
      { story: storyRef, venue: venueRef },
      animated,
      stages,
      progress.get(),
    );
    return resetHandoff;
  }, [animated, handoff, progress, stages]);

  useMotionValueEvent(progress, 'change', (value) =>
    syncInert({ story: storyRef, venue: venueRef }, animated, stages, value),
  );

  // Stage 1 → 2.
  const wordmarkScale = useTransform(
    progress,
    [stages.still[1], stages.spread[1]],
    [1, 0.16],
    { clamp: true },
  );
  const wordmarkY = useTransform(
    progress,
    [stages.still[1], stages.spread[1]],
    ['0vh', '-34vh'],
    { clamp: true },
  );
  const wordmarkOpacity = useTransform(
    progress,
    [stages.still[1], stages.spread[1] * 0.92, stages.spread[1]],
    [1, 0.35, 0],
    { clamp: true },
  );
  const positioningOpacity = useTransform(
    progress,
    [0, stages.still[1], stages.spread[0] + 0.06],
    [1, 1, 0],
    { clamp: true },
  );

  // Stage 4.
  const venueOpacity = useTransform(
    progress,
    [stages.disperse[0], stages.disperse[1]],
    [0, 1],
    { clamp: true },
  );

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <WaterForm progress={progress} stages={stages} />

      <Container className="relative">
        {/* Stage 1 — still water. */}
        <motion.div
          className="text-center"
          style={
            animated
              ? { scale: wordmarkScale, y: wordmarkY, opacity: wordmarkOpacity }
              : undefined
          }
        >
          <h1 className="font-display text-hero tracking-hero text-text-primary">
            {site.wordmark}
          </h1>
        </motion.div>

        <motion.p
          className="mt-4 text-center text-lg text-balance text-text-secondary"
          style={animated ? { opacity: positioningOpacity } : undefined}
        >
          {home.positioningLine}
        </motion.p>

        {/*
          Stages 3 and 4 occupy the same space once the wordmark has gone. In
          the full tier they are absolutely positioned so they add no height to
          a stage that is exactly 100svh; at reduced/static they flow normally,
          which is the readable layout — reduced motion is a first-class
          composition, not a fallback.
        */}
        <div
          className={
            animated
              ? 'absolute inset-x-0 top-1/2 -translate-y-1/2'
              : 'mt-16 space-y-12'
          }
        >
          <div ref={storyRef}>
            <BrandStory
              progress={progress}
              range={[stages.story[0], stages.story[1]]}
            />
          </div>

          <motion.div
            ref={venueRef}
            className={animated ? 'mt-10' : undefined}
            style={animated ? { opacity: venueOpacity } : undefined}
          >
            <ImageReveal className="mx-auto max-w-lead">
              {/*
                Stands in for photography, which arrives after the venue opens
                (docs/OPEN-QUESTIONS.md C7). role="img" + a label so it is
                described rather than announced as an empty box.
              */}
              <div
                role="img"
                aria-label={home.venueImageAlt}
                className="h-56 flex w-full items-center justify-center bg-surface-accent"
              >
                <span className="text-xs tracking-eyebrow text-text-secondary uppercase">
                  görsel
                </span>
              </div>
            </ImageReveal>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}

export function HeroWater() {
  return (
    <PinnedSequence distance="300svh" mobileDistance="180svh">
      <Stage />
    </PinnedSequence>
  );
}
