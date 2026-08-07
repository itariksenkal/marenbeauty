import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Every route at reduced motion.
 *
 * `prefers-reduced-motion: reduce` means **the final state, immediately** —
 * not a faster animation (`CLAUDE.md` §13). The failure mode this catches is
 * content that is only readable once something has animated, which is the same
 * defect as content only readable once JavaScript has run.
 *
 * The emulation is applied with `page.emulateMedia()` in a `beforeEach`, not
 * with Playwright's `reducedMotion` use-option. That option was probed at M6
 * and had no effect at describe, file OR project level: `matchMedia` still
 * reported false, so the tests were running against the full tier while
 * claiming otherwise — worse than not having them.
 */
const ROUTES = [
  '/',
  '/hizmetler',
  '/hizmetler/hydrafacial',
  '/hakkimizda',
  '/galeri',
  '/blog',
  '/blog/cilt-bakimi-nedir',
  '/sss',
  '/iletisim',
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('reduced motion', () => {
  test('the emulation is actually in effect', async ({ page }) => {
    // Asserted first, because every test below is meaningless without it.
    await page.goto('/');
    expect(
      await page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    ).toBe(true);
  });

  for (const route of ROUTES) {
    test(`${route} renders its final state with no violation`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Nothing is pinned: a reduced-motion visitor gets normal flow.
      const pinnedHeights = await page
        .locator('[data-pinned-sequence]')
        .evaluateAll((elements) =>
          elements.map((el) => getComputedStyle(el).height),
        );
      for (const height of pinnedHeights) {
        expect(height, route).toBe('auto');
      }

      // Nothing is clipped away.
      const clipped = await page
        .locator('[data-reveal-line]')
        .evaluateAll((elements) =>
          elements
            .map((el) => getComputedStyle(el).clipPath)
            .filter((clip) => clip !== 'none'),
        );
      expect(clipped, route).toEqual([]);

      // And it is still accessible in that state.
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();
      expect(
        results.violations.map((v) => v.id),
        route,
      ).toEqual([]);
    });
  }

  test('the visit sequence is fully legible without scrolling', async ({
    page,
  }) => {
    // The step marker animates; the text never does. At reduced motion — and
    // at any scroll position — all four steps read at full contrast.
    // Presence is checked at domcontentloaded — the text must be in the DOM
    // from first paint, not mounted on scroll.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const steps = page.locator('[data-step]');
    await expect(steps).toHaveCount(4);

    // Opacity is checked AFTER load. `getComputedStyle` before the stylesheet
    // applies returns an empty string, which `Number('')` turns into 0 — a
    // failure that looks exactly like invisible text and is not one.
    await page.waitForLoadState('load');
    const opacities = await steps.evaluateAll((elements) =>
      elements.map((el) => getComputedStyle(el).opacity),
    );
    expect(opacities).toHaveLength(4);
    for (const opacity of opacities) {
      expect(Number(opacity)).toBe(1);
    }
  });
});
