import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import { channelHref, contact, type ContactChannelKey } from '@/config/contact';
import { experience } from '@/config/experience';
import { home } from '@/config/home';
import { serviceGroups } from '@/config/services';
import { site } from '@/config/site';
import { testimonials } from '@/config/testimonials';
import { contrastRatio } from '@/lib/contrast';

const norm = (path: string) => path.split(sep).join('/');

const sources: { file: string; text: string }[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full))
      sources.push({ file: norm(full), text: readFileSync(full, 'utf8') });
  }
};
walk(join(process.cwd(), 'src'));

/**
 * Source with comments stripped.
 *
 * Every one of these files DOCUMENTS the rule it follows — "embeds no map",
 * "never a filter", "no disabled button" — so asserting against the raw text
 * flags the explanation rather than the code. The content guard avoids the same
 * trap by scanning build output instead of source.
 */
const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const read = (relative: string) =>
  stripComments(sources.find((s) => s.file.endsWith(relative))?.text ?? '');

/* ── Text over the aurora, at its worst case ───────────────────────────────── */

describe('contrast over the aurora at worst case', () => {
  const CREAM = '#faf4ec';
  const ALPHA = 0.55; // --aurora-alpha

  /** Composite a blob over the base wash, as the browser will. */
  const composite = (blob: string, alpha: number) => {
    const hex = (value: string, at: number) =>
      parseInt(value.slice(1 + at * 2, 3 + at * 2), 16);
    const mix = (at: number) =>
      Math.round(alpha * hex(blob, at) + (1 - alpha) * hex(CREAM, at));
    return `#${[0, 1, 2]
      .map((i) => mix(i).toString(16).padStart(2, '0'))
      .join('')}`;
  };

  /** Every stop any section sets, plus the raw colour for overlapping blobs. */
  const STOPS = {
    nude: '#ebdccd',
    'rose-beige': '#dfc9bb',
    blush: '#d2b3a5',
    champagne: '#dec79c',
    'champagne-light': '#efe2c6',
  } as const;

  const TEXT = {
    'text-primary': '#241511',
    'text-secondary': '#55372f',
    'text-muted': '#7c564c',
  } as const;

  it.each(Object.entries(STOPS))(
    'text-primary clears AA over %s',
    (_name, blob) => {
      expect(
        contrastRatio(TEXT['text-primary'], composite(blob, ALPHA)),
      ).toBeGreaterThanOrEqual(4.5);
      // And at the absolute worst case: overlapping blobs, i.e. the raw colour.
      expect(contrastRatio(TEXT['text-primary'], blob)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it.each(Object.entries(STOPS))(
    'text-secondary clears AA over %s',
    (_name, blob) => {
      expect(
        contrastRatio(TEXT['text-secondary'], blob),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('text-muted does NOT clear AA at the worst case — which is why it is barred', () => {
    // clay on blush is 3.26:1. This is the reason `tone="transparent"` permits
    // only text-primary and text-secondary. If this ever starts passing, the
    // palette changed and §1.4 needs recomputing.
    expect(contrastRatio(TEXT['text-muted'], STOPS.blush)).toBeLessThan(4.5);
  });

  it('no section sets an aurora stop darker than blush', () => {
    const used = serviceGroups.flatMap((g) => [g.auroraB, g.auroraC]);
    for (const stop of used) {
      expect(stop, `${stop} is not a permitted aurora stop`).toMatch(
        /--mb-(nude|rose-beige|blush|champagne|champagne-light)\)/,
      );
    }
  });

  it('--aurora-a is never overridden, so boundaries stay soft', () => {
    for (const { file, text } of sources) {
      expect(stripComments(text), file).not.toMatch(/'--aurora-a'/);
    }
  });
});

/* ── Sections that must render nothing ─────────────────────────────────────── */

describe('absence rather than placeholder', () => {
  it('testimonials ship empty and the section returns null', () => {
    expect(testimonials).toEqual([]);
    expect(read('sections/TestimonialsSection.tsx')).toMatch(
      /testimonials\.length === 0\)\s*return null/,
    );
  });

  /**
   * The steps are no longer empty — they are placeholder copy pending the
   * owner's words (docs/OPEN-QUESTIONS.md C11). What must survive is the
   * MECHANISM: emptying the array removes the section with no component edit.
   */
  it('the process section still disappears when the steps are emptied', () => {
    expect(read('sections/ExperienceProcess.tsx')).toMatch(
      /experience\.steps\.length === 0\)\s*return null/,
    );
    expect(read('sections/ExperienceSteps.tsx')).toMatch(
      /experience\.steps\.length === 0\)\s*return null/,
    );
  });

  it('the visit steps state no fact the business has not confirmed', () => {
    const copy = experience.steps
      .map((step) => `${step.title} ${step.body}`)
      .join(' ');

    // No duration, no session count, no product, no device, no credential.
    expect(copy).not.toMatch(/\d+\s*(dakika|saat|seans|hafta|ay)/i);
    expect(copy).not.toMatch(/(?<![\p{L}\p{N}])(?:dr\.|uzman|hemşire)/iu);
    expect(copy).not.toMatch(/%\s?\d/);
  });

  /**
   * Channels are configured from M17 with PLACEHOLDER values (docs/STATUS.md).
   * The invariant that matters is unchanged: `channelHref` never returns a bare
   * scheme, and a channel set back to `null` disappears.
   */
  it('every configured channel resolves to a complete href, never a bare scheme', () => {
    for (const key of Object.keys(contact) as ContactChannelKey[]) {
      const href = channelHref(key);
      expect(href, key).not.toBeNull();
      expect(href, key).not.toMatch(/^(tel|mailto|sms):$/);
      expect(href, key).toMatch(/^(?:tel:\+?\d|mailto:[^@]+@|https:\/\/)/);
    }
  });

  it('the CTA never renders a disabled control or a "yakında" tooltip', () => {
    const cta = read('sections/ContactCta.tsx');
    expect(cta).not.toMatch(/disabled/);
    expect(cta).not.toMatch(/title=|tooltip/i);
    // Channels are rendered only when the href resolves.
    expect(cta).toMatch(/whatsapp \? \(/);
    expect(cta).toMatch(/phone \? \(/);
  });
});

/* ── Pinned sections: exactly two on the site ─────────────────────────────── */

describe('pinned sections', () => {
  it('exactly two sections use PinnedSequence', () => {
    // docs/MOTION.md §2.6. /motion also uses it, but that route is dev-only and
    // 404s in production, so it is not "on the site".
    const users = sources
      .filter((s) => s.file.includes('src/components/sections/'))
      .filter((s) => /<PinnedSequence/.test(stripComments(s.text)))
      .map((s) => s.file.replace(/.*src\//, 'src/'));
    expect(users.sort()).toEqual([
      'src/components/sections/ExperienceProcess.tsx',
      'src/components/sections/HeroWater.tsx',
    ]);
  });
});

/* ── Sticky panel spec — docs/MOTION.md §3.2 ──────────────────────────────── */

describe('sticky panel stack', () => {
  const stack = read('motion/StickyPanelStack.tsx');

  it('uses the 40px top radius token', () => {
    expect(stack).toContain('rounded-t-panel');
  });

  it('dims via an overlay opacity, never a filter', () => {
    // A filter would push the whole subtree onto its own layer.
    // Matched loosely on purpose — this asserts the MECHANISM (an opacity
    // driven by `dim`), not a particular line of code, so a refactor that
    // keeps the mechanism does not fail here.
    expect(stack).toMatch(/opacity:[^}]*dim/);
    expect(stack).not.toMatch(/filter\s*:/);
    expect(stack).not.toMatch(/brightness/);
  });

  it('drives panel progress from the stack, not the panel', () => {
    // A sticky panel's own rect stops moving once it pins, so useScroll on the
    // panel yields no progress and nothing ever scales. A browser test caught
    // this; this pins the cause.
    expect(stack).toMatch(/useScroll\(\{[\s\S]*target: ref/);
    expect(stack).toContain('StackProgressContext');
  });

  it('scales and dims to the tokens, not to literals', () => {
    expect(stack).toContain('transforms.panelScale');
    expect(stack).toContain('transforms.panelDim');
  });
});

/* ── Honest pre-launch, honest location ───────────────────────────────────── */

describe('pre-launch band', () => {
  const band = read('layout/PreLaunchBand.tsx');

  it('renders only while isPreLaunch', () => {
    expect(site.isPreLaunch).toBe(true);
    expect(band).toMatch(/if \(!site\.isPreLaunch\) return null/);
  });

  it('carries no date and no countdown', () => {
    expect(home.preLaunchNotice).not.toMatch(
      /\d{4}|\d{1,2}\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/i,
    );
    expect(band).not.toMatch(/countdown|setInterval|Date\.now/i);
  });
});

describe('location', () => {
  const card = read('sections/LocationCard.tsx');

  it('shows the district from site config, with no street line', () => {
    expect(card).toContain('site.address.region');
    expect(card).toContain('site.address.locality');
    expect('streetAddress' in site.address).toBe(false);
  });

  it('embeds no map', () => {
    expect(card).not.toMatch(/iframe|google\.com\/maps|maps\.google/i);
  });
});

/* ── Copy discipline ──────────────────────────────────────────────────────── */

describe('home copy', () => {
  it('lives in config — no section component contains a Turkish sentence', () => {
    const turkishSentence = /['"`][^'"`\n]*\s(bir|ve|için|ile)\s[^'"`\n]*['"`]/;
    const offenders = sources
      .filter((s) => s.file.includes('src/components/sections/'))
      .filter((s) => turkishSentence.test(stripComments(s.text)))
      .map((s) => s.file);
    expect(offenders).toEqual([]);
  });

  it('interpolates the district so it cannot go stale', () => {
    expect(home.positioningLine).toContain(site.address.locality);
    expect(home.positioningLine).toContain(site.address.region);
  });

  it('states no duration, price or opening date', () => {
    const all = JSON.stringify(home);
    expect(all).not.toMatch(/\bdakika\b|\bsaat\b|₺|\bTL\b/);
    expect(all).not.toMatch(/20\d{2}/);
  });
});
