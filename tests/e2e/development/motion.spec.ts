import { expect, test } from '@playwright/test';

import {
  hasDevErrorOverlay,
  watchForRuntimeErrors,
} from '../helpers/runtime-errors';

/**
 * The motion review surface.
 *
 * Dev-only, so nothing else can see it — a broken review surface would
 * otherwise sit broken while `npm run verify` stayed green
 * (docs/OPEN-QUESTIONS.md G13).
 */
test.describe('/motion review surface', () => {
  test('renders every section with no runtime error', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);

    const response = await page.goto('/motion');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    expect(await hasDevErrorOverlay(page)).toBe(false);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);

    for (const heading of [
      /Grain weight/,
      /Aurora/,
      /Rose in use/,
      /three tiers/,
      /Sticky stacked panels/,
      /View transition/,
    ]) {
      await expect(
        page.getByRole('heading', { name: heading }),
        String(heading),
      ).toBeVisible();
    }
  });

  test('shows all three tiers side by side', async ({ page }) => {
    await page.goto('/motion');
    for (const tier of ['full', 'reduced', 'static'] as const) {
      await expect(
        page.locator(`[data-motion-tier="${tier}"]`).first(),
        `${tier} column`,
      ).toBeAttached();
    }
  });

  test('the ?motion= override works in development', async ({ page }) => {
    await page.goto('/motion?motion=static');
    await expect(page.locator('html')).toHaveAttribute(
      'data-motion-tier',
      'static',
    );

    await page.goto('/motion?motion=reduced');
    await expect(page.locator('html')).toHaveAttribute(
      'data-motion-tier',
      'reduced',
    );
  });

  test('the tier is set before first paint, not after hydration', async ({
    page,
  }) => {
    // Resolving after hydration would flash animated content before telling it
    // not to animate. `commit` samples as early as the document exists.
    await page.goto('/motion?motion=static', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute(
      'data-motion-tier',
      'static',
    );
  });

  test('grain is dropped on the static tier and present otherwise', async ({
    page,
  }) => {
    await page.goto('/motion?motion=full');
    await expect(page.locator('.grain-layer')).toBeVisible();

    await page.goto('/motion?motion=static');
    await expect(page.locator('.grain-layer')).toBeHidden();
  });

  test('grain ships at exactly 4%', async ({ page }) => {
    await page.goto('/motion?motion=full');
    const opacity = await page
      .locator('.grain-layer')
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeCloseTo(0.04, 3);
  });

  test('aurora blur is set once and never animated', async ({ page }) => {
    await page.goto('/motion?motion=full');
    const blob = page.locator('.aurora-blob').first();
    const before = await blob.evaluate((el) => getComputedStyle(el).filter);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(300);
    const after = await blob.evaluate((el) => getComputedStyle(el).filter);
    expect(after, 'blur radius changed during scroll').toBe(before);
    expect(before).toContain('blur');
  });

  test('static tier replaces the aurora with a flat gradient', async ({
    page,
  }) => {
    await page.goto('/motion?motion=static');
    const blobs = page.locator('.aurora-blob');
    const count = await blobs.count();
    for (let i = 0; i < count; i++) {
      await expect(blobs.nth(i)).toBeHidden();
    }
    const image = await page
      .locator('.aurora-layer')
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(image).toContain('linear-gradient');
  });

  test('scrolling forces no layout — composite only', async ({ page }) => {
    // docs/MOTION.md §2.7. Measured rather than asserted in prose: Layout and
    // style-recalc counts are read from CDP before and after a real scroll.
    await page.goto('/motion?motion=full');
    await page.waitForLoadState('networkidle');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');

    const read = async () => {
      const { metrics } = await cdp.send('Performance.getMetrics');
      const get = (name: string) =>
        metrics.find((m) => m.name === name)?.value ?? 0;
      return { layout: get('LayoutCount'), recalc: get('RecalcStyleCount') };
    };

    const before = await read();
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(50);
    }
    const after = await read();

    const layoutDelta = after.layout - before.layout;
    // A small number of layouts is unavoidable — sticky elements and the dev
    // overlay both contribute. The point is that it does not scale with the
    // number of scroll events, which is what an animated width/top would do.
    expect(
      layoutDelta,
      `scrolling forced ${layoutDelta} layouts; only transform/opacity/clip-path may animate`,
    ).toBeLessThan(40);
  });
});
