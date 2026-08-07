'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

import { Container } from '@/components/layout/Container';
import {
  PinnedSequence,
  usePinnedProgress,
} from '@/components/motion/PinnedSequence';
import { WaterForm } from '@/components/motion/WaterForm';
import { BrandStory } from '@/components/sections/BrandStory';
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
  // `story`, not `disperse`: the photograph now fades in alongside the brand
  // lines, and content that is on screen must not be inert.
  refs.venue.current?.toggleAttribute(
    'inert',
    animated && value < stages.story[0],
  );
}

function Stage({
  venueImage,
  wordmark,
}: {
  venueImage: React.ReactNode;
  wordmark: React.ReactNode;
}) {
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

  // The server cannot know the tier, so it renders as if `full`. A brief
  // full-tier client render can set `inert` before the tier resolves to
  // reduced — and then nothing would ever take it off, leaving content inert
  // for exactly the visitor who must not get it.
  useEffect(() => {
    syncInert(
      { story: storyRef, venue: venueRef },
      animated,
      stages,
      animated ? progress.get() : 1,
    );
  }, [animated, progress, stages]);

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

  // Stage 4.
  /**
   * The photograph arrives DURING the story, not after it.
   *
   * It used to ramp across `disperse`, which meant the right-hand half of the
   * screen stayed empty for the whole of stage 3 while the brand lines read.
   * Starting a quarter of the way into `story` means the image is settling in
   * as the lines land, and the stage is never half-empty.
   */
  const venueOpacity = useTransform(
    progress,
    [
      stages.story[0] + (stages.story[1] - stages.story[0]) * 0.25,
      stages.story[1],
    ],
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
          {/*
            The whole opening block — logo AND slogan — comes in as one node
            from the server. They are together because the slogan is centred on
            the NAME inside the lockup rather than on the lockup as a whole, and
            only the thing that knows the lockup's geometry can do that.
          */}
          {wordmark}
        </motion.div>

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
          {/*
            Two columns from lg up: the story lines read down the left, the
            photograph fills the right. Stacked, the right half of this screen
            was empty for the whole story stage — the single emptiest area on
            the site, and the thing the owner kept pointing at.

            The text column is the wider of the two on purpose. These lines are
            set at the display scale and the stage is exactly one viewport
            tall; an even split makes them wrap an extra time and overflow the
            pin.
          */}
          <div className="lg:gap-14 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div ref={storyRef}>
              <BrandStory
                progress={progress}
                range={[stages.story[0], stages.story[1]]}
              />
            </div>

            <motion.div
              ref={venueRef}
              style={animated ? { opacity: venueOpacity } : undefined}
            >
              {/*
                NOT wrapped in `ImageReveal` — signature #4 stays on the
                service pages, where it works.
                
                It starts at `clip-path: inset(100% 0 0 0)` and opens on
                `whileInView` with `once: true`. Inside this pinned stage the
                element is absolutely positioned and technically in the
                viewport from first paint, so the observer resolves against a
                box that is not yet the one the reader will see — and the
                photograph stayed fully clipped at every scroll position.
                Measured, not reasoned about: the element had opacity 1 and
                correct bounds and still drew nothing.

                The opacity ramp above IS the reveal here. One mechanism.
              */}
              {venueImage}
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function HeroWater({
  venueImage,
  wordmark,
}: {
  venueImage: React.ReactNode;
  wordmark: React.ReactNode;
}) {
  return (
    <PinnedSequence distance="300svh" mobileDistance="180svh">
      <Stage venueImage={venueImage} wordmark={wordmark} />
    </PinnedSequence>
  );
}
