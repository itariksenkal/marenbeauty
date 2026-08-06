import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  MAX_DURATION_MS,
  durations,
  easings,
  seconds,
  stagger,
  transforms,
} from '@/config/motion';

/**
 * Motion values exist twice — as custom properties in theme.css for CSS, and
 * as numbers in motion.ts for the `motion` library, which cannot read CSS vars.
 *
 * Two representations of one value is a drift risk. This closes it: the numbers
 * are checked against the stylesheet itself, so changing one without the other
 * fails here rather than shipping a transition that is 220ms in CSS and 400ms
 * in JavaScript.
 */
const THEME = readFileSync(
  join(process.cwd(), 'src', 'styles', 'theme.css'),
  'utf8',
);

function cssMs(token: string): number {
  const match = THEME.match(new RegExp(`--${token}:\\s*(-?[\\d.]+)ms\\s*;`));
  if (!match?.[1]) throw new Error(`--${token} not found in theme.css`);
  return Number(match[1]);
}

function cssNumber(token: string): number {
  const match = THEME.match(
    new RegExp(`--${token}:\\s*(-?[\\d.]+)(?:px)?\\s*;`),
  );
  if (!match?.[1]) throw new Error(`--${token} not found in theme.css`);
  return Number(match[1]);
}

function cssBezier(token: string): number[] {
  const match = THEME.match(
    new RegExp(`--${token}:\\s*cubic-bezier\\(([^)]+)\\)\\s*;`),
  );
  if (!match?.[1]) throw new Error(`--${token} not found in theme.css`);
  return match[1].split(',').map((n) => Number(n.trim()));
}

describe('motion tokens match theme.css', () => {
  it.each(Object.keys(durations) as (keyof typeof durations)[])(
    'duration.%s',
    (key) => {
      expect(durations[key]).toBe(cssMs(`duration-${key}`));
    },
  );

  it.each(Object.keys(easings) as (keyof typeof easings)[])(
    'ease.%s',
    (key) => {
      expect([...easings[key]]).toEqual(cssBezier(`ease-${key}`));
    },
  );

  it('stagger', () => {
    expect(stagger.line).toBe(cssMs('stagger-line'));
    expect(stagger.item).toBe(cssMs('stagger-item'));
    expect(stagger.cap).toBe(cssNumber('stagger-cap'));
  });

  it('transforms', () => {
    expect(transforms.lift).toBe(cssNumber('motion-lift'));
    expect(transforms.imageScale).toBe(cssNumber('motion-image-scale'));
    expect(transforms.panelScale).toBe(cssNumber('motion-panel-scale'));
    expect(transforms.panelDim).toBe(cssNumber('motion-panel-dim'));
  });
});

describe('motion budget', () => {
  it('no duration exceeds the 400ms ceiling', () => {
    for (const [key, ms] of Object.entries(durations)) {
      expect(ms, `durations.${key}`).toBeLessThanOrEqual(MAX_DURATION_MS);
    }
  });

  it('scroll-linked smoothing stays at or under 200ms', () => {
    expect(durations.settle).toBeLessThanOrEqual(200);
  });

  it('a full stagger run stays within a reasonable ceiling', () => {
    // cap × per-item + the item's own duration — docs/MOTION.md §3.3.
    const total = stagger.cap * stagger.line + durations.slow;
    expect(total).toBeLessThanOrEqual(700);
  });

  it('seconds are derived from milliseconds, not retyped', () => {
    for (const [key, ms] of Object.entries(durations)) {
      expect(seconds[key as keyof typeof durations]).toBeCloseTo(ms / 1000, 6);
    }
  });
});
