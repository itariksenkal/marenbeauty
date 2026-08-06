import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import { motionTierScript } from '@/components/motion/motion-tier-script';
import { MAX_DURATION_MS, durations, stagger } from '@/config/motion';
import { MOTION_TIERS, isMotionTier } from '@/hooks/use-motion-tier';

/** Platform-independent, and keeps backslash literals out of this file. */
const norm = (path: string) => path.split(sep).join('/');

const sourceFiles: string[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full)) sourceFiles.push(full);
  }
};
walk(join(process.cwd(), 'src'));

const sources = sourceFiles.map((file) => ({
  file: norm(file),
  text: readFileSync(file, 'utf8'),
}));

/* ── Scroll is never hijacked — docs/MOTION.md §2.3 ────────────────────────── */

describe('scroll is never hijacked', () => {
  it('no wheel or touchmove listener exists anywhere in src/', () => {
    const offenders = sources
      .filter(({ text }) =>
        /addEventListener\(\s*['"`](wheel|touchmove|touchstart)['"`]/.test(
          text,
        ),
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('nothing calls preventDefault near a scroll event', () => {
    const offenders = sources
      .filter(({ text }) =>
        /(wheel|touchmove)[\s\S]{0,120}preventDefault/.test(text),
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('no smooth-scroll library is installed', () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    );
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const banned of [
      'lenis',
      '@studio-freight/lenis',
      'locomotive-scroll',
      'gsap',
    ]) {
      expect(deps, banned).not.toContain(banned);
    }
  });

  it('every scroll listener is passive', () => {
    const withScroll = sources.filter(({ text }) =>
      /addEventListener\(\s*['"`]scroll['"`]/.test(text),
    );
    for (const { file, text } of withScroll) {
      expect(text, `${file} must register scroll as passive`).toMatch(
        /addEventListener\(\s*['"`]scroll['"`][^;]*passive:\s*true/,
      );
    }
  });
});

/* ── Tier resolution ───────────────────────────────────────────────────────── */

describe('motion tier script', () => {
  it('enables the ?motion= override only in development', () => {
    expect(motionTierScript(true)).toContain('true&&');
    const prod = motionTierScript(false);
    expect(prod).toContain('false&&');
    expect(prod).not.toContain('__DEV__');
  });

  it('writes the tier onto <html> before paint', () => {
    expect(motionTierScript(false)).toContain('dataset.motionTier');
  });

  it('falls back to full if detection throws', () => {
    expect(motionTierScript(false)).toMatch(
      /catch[\s\S]*motionTier\s*=\s*'full'/,
    );
  });

  it('lets reduced-motion win over static', () => {
    // prefers-reduced-motion is assigned last, so it takes precedence over the
    // low-end heuristics — someone who asked for less motion gets it.
    const script = motionTierScript(false);
    expect(script.indexOf('prefers-reduced-motion')).toBeGreaterThan(
      script.indexOf('prefers-reduced-data'),
    );
  });

  it('defaults to full when the detection APIs are absent', () => {
    // deviceMemory / connection are Chromium-only. Safari and Firefox must not
    // be degraded for failing to report (docs/MOTION.md §6).
    const script = motionTierScript(false);
    expect(script).toContain("t='full'");
    expect(script).toMatch(/n\.deviceMemory&&/);
    expect(script).toMatch(/n\.hardwareConcurrency&&/);
  });
});

describe('tier helpers', () => {
  it.each(MOTION_TIERS)('%s is a valid tier', (tier) => {
    expect(isMotionTier(tier)).toBe(true);
  });

  it.each(['', 'FULL', 'none', 'reduce'])('%s is not a tier', (value) => {
    expect(isMotionTier(value)).toBe(false);
  });
});

/* ── Only GPU-composited properties animate — docs/MOTION.md §2.2 ─────────── */

describe('animated properties', () => {
  const motionSources = sources.filter(({ file }) =>
    file.includes('src/components/motion/'),
  );

  it('has motion components to check', () => {
    expect(motionSources.length).toBeGreaterThan(0);
  });

  it('never animates a layout-triggering property', () => {
    const banned =
      /(initial|animate|whileInView|exit)\s*=\s*\{\{[^}]*\b(width|height|top|left|right|bottom|margin|padding|boxShadow)\s*:/;
    const offenders = motionSources
      .filter(({ text }) => banned.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('never animates filter — a blur radius re-rasterises every frame', () => {
    const offenders = motionSources
      .filter(({ text }) =>
        /(initial|animate|whileInView)\s*=\s*\{\{[^}]*filter\s*:/.test(text),
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});

/* ── Budget ────────────────────────────────────────────────────────────────── */

describe('budget', () => {
  it('no duration exceeds the ceiling', () => {
    for (const [key, ms] of Object.entries(durations)) {
      expect(ms, key).toBeLessThanOrEqual(MAX_DURATION_MS);
    }
  });

  it('a full stagger run stays under 700ms', () => {
    expect(stagger.cap * stagger.line + durations.slow).toBeLessThanOrEqual(
      700,
    );
  });
});

/* ── Grain — docs/MOTION.md §3.6 ───────────────────────────────────────────── */

describe('grain overlay', () => {
  /**
   * Comments are stripped before asserting. theme.css DOCUMENTS why there is
   * no feTurbulence and no mix-blend-mode, so checking the raw text would flag
   * its own explanation — the same trap the content guard avoids by scanning
   * build output rather than source.
   */
  const stripCssComments = (css: string) =>
    css.replace(/\/\*[\s\S]*?\*\//g, '');

  const theme = stripCssComments(
    readFileSync(join(process.cwd(), 'src', 'styles', 'theme.css'), 'utf8'),
  );

  it('uses a pre-rendered tile, not an SVG filter', () => {
    expect(theme).toContain("url('/grain.png')");
    expect(theme).not.toMatch(/feTurbulence/);
  });

  it('never uses mix-blend-mode anywhere', () => {
    // A full-screen blend forces the whole page into one composited group.
    expect(theme).not.toMatch(/mix-blend-mode/);
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/mixBlendMode/);
    }
  });

  it('is pointer-events: none and aria-hidden', () => {
    const grain = sources.find(({ file }) =>
      file.endsWith('components/motion/GrainOverlay.tsx'),
    );
    expect(grain).toBeDefined();
    expect(grain?.text).toContain('aria-hidden');
    expect(theme).toMatch(/grain-layer[\s\S]{0,400}pointer-events:\s*none/);
  });

  it('is dropped only on the static tier', () => {
    expect(theme).toMatch(
      /\[data-motion-tier='static'\]\s*\.grain-layer[\s\S]{0,80}display:\s*none/,
    );
  });
});
