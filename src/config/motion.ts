/**
 * Motion tokens — the single source for JavaScript.
 *
 * `src/styles/theme.css` is the source for CSS; this file mirrors it for the
 * `motion` library, which needs numbers rather than custom properties. Two
 * representations of the same values is a drift risk, so it is closed rather
 * than tolerated: `src/config/motion.test.ts` parses theme.css and asserts
 * every value here matches the stylesheet. Change one without the other and
 * the test fails.
 *
 * No numeric duration may appear anywhere else. ESLint enforces that inside
 * `src/components/` (docs/MOTION.md §7) — a raw `duration: 0.6` fails lint,
 * not review.
 */

/** Hard ceiling for any discrete transition. Nothing may exceed this. */
export const MAX_DURATION_MS = 400;

/** Milliseconds, matching --duration-* in theme.css. */
export const durations = {
  instant: 0,
  fast: 140,
  base: 220,
  slow: 320,
  slowest: 400,
  /** Max lag for scroll-linked smoothing. Only the aurora is smoothed. */
  settle: 200,
} as const;

export type DurationToken = keyof typeof durations;

/** The `motion` library takes seconds. Derived, never retyped. */
export const seconds = Object.fromEntries(
  Object.entries(durations).map(([key, ms]) => [key, ms / 1000]),
) as Readonly<Record<DurationToken, number>>;

/**
 * Cubic-bézier control points, matching --ease-* in theme.css.
 * `water` is the brand easing: quick to move, long unhurried settle.
 */
export const easings = {
  standard: [0.2, 0.6, 0.2, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  water: [0.33, 0.9, 0.28, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingToken = keyof typeof easings;

/** Milliseconds between staggered children, and the cap on how many stagger. */
export const stagger = {
  line: 60,
  item: 40,
  /** Beyond this, animate as a group — 10 items at 60ms overruns the budget. */
  cap: 6,
} as const;

/** Transform limits from docs/DESIGN-SYSTEM.md §7. */
export const transforms = {
  /** Hover lift, in px. */
  lift: -4,
  /** Image reveal inner scale: 1.12 → 1. */
  imageScale: 1.12,
  /** Outgoing sticky panel scale. */
  panelScale: 0.96,
  /** Outgoing sticky panel scrim opacity. */
  panelDim: 0.55,
} as const;

/**
 * CSS custom property references, for cases where a style prop is cleaner than
 * a class. Using these keeps the value in one place even in inline styles.
 */
export const cssVars = {
  durationFast: 'var(--duration-fast)',
  durationBase: 'var(--duration-base)',
  durationSlow: 'var(--duration-slow)',
  durationSlowest: 'var(--duration-slowest)',
  durationSettle: 'var(--duration-settle)',
  easeStandard: 'var(--ease-standard)',
  easeEntrance: 'var(--ease-entrance)',
  easeExit: 'var(--ease-exit)',
  easeWater: 'var(--ease-water)',
} as const;

/**
 * Guard for anything computing a duration at runtime. The budget is a rule,
 * not a suggestion — see docs/MOTION.md §2.
 */
export function assertWithinBudget(ms: number): number {
  if (ms > MAX_DURATION_MS) {
    throw new Error(
      `Motion budget exceeded: ${ms}ms > ${MAX_DURATION_MS}ms. ` +
        `See docs/MOTION.md §7 — no discrete transition may exceed 400ms.`,
    );
  }
  return ms;
}
