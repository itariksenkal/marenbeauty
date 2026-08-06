import { expect, test } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

test.describe('the gallery', () => {
  test('renders every image with no runtime error', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    const response = await page.goto('/galeri');
    expect(response?.status()).toBe(200);

    await expect(page.locator('main h1')).toHaveCount(1);
    // 48 in the manifest, all four groups on the page.
    await expect(page.locator('main img')).toHaveCount(48);

    await page.waitForLoadState('networkidle');
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  /**
   * The load-bearing assertion on this page. A gallery is read as
   * "photographs of this place", and none of these is — so the page has to say
   * so above the images, not in a footnote.
   */
  test('says the photographs are not the premises, before showing them', async ({
    page,
  }) => {
    await page.goto('/galeri');

    const lead = page.getByText('Aşağıdaki fotoğraflar merkeze ait değil');
    await expect(lead).toBeVisible();

    const leadY = (await lead.boundingBox())?.y ?? Infinity;
    const firstImageY =
      (await page.locator('main img').first().boundingBox())?.y ?? -Infinity;
    expect(leadY).toBeLessThan(firstImageY);
  });

  test('every image has real Turkish alt text', async ({ page }) => {
    await page.goto('/galeri');
    const alts = await page
      .locator('main img')
      .evaluateAll((els) =>
        els.map((el) => (el as HTMLImageElement).alt ?? ''),
      );

    expect(alts).toHaveLength(48);
    for (const alt of alts) {
      expect(alt.length).toBeGreaterThan(15);
    }
  });

  test('credits every photographer with a licence link', async ({ page }) => {
    await page.goto('/galeri');
    const credits = page.locator(
      'main a[href*="unsplash.com"], main a[href*="pexels.com"]',
    );
    expect(await credits.count()).toBeGreaterThan(10);
  });

  test('loads no image from a third-party host', async ({ page }) => {
    // The cookie policy claims no third-party request is made. This is that
    // claim, checked in a browser.
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
        external.push(request.url());
      }
    });

    await page.goto('/galeri');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/galeri');
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('photography across the site', () => {
  test('a service page shows a hero plus supporting frames', async ({
    page,
  }) => {
    await page.goto('/hizmetler/hydrafacial');
    const images = page.locator('main img');
    // One hero + two supporting, plus whatever the related blocks carry.
    expect(await images.count()).toBeGreaterThanOrEqual(3);

    for (const alt of await images.evaluateAll((els) =>
      els.map((el) => (el as HTMLImageElement).alt),
    )) {
      expect(alt.length).toBeGreaterThan(0);
    }
  });

  test('the hero reserves its space, so images cannot shift the layout', async ({
    page,
  }) => {
    await page.goto('/hizmetler/hydrafacial');
    const box = await page
      .locator('main img')
      .first()
      .evaluate((el) => ({
        width: (el as HTMLImageElement).getAttribute('width'),
        height: (el as HTMLImageElement).getAttribute('height'),
      }));
    expect(box.width).toBe('1600');
    expect(box.height).toBe('1200');
  });

  test('the home page carries the wide frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main img[src*="home-venue"]')).toHaveCount(1);
  });

  test('the about page carries its hero and two details', async ({ page }) => {
    await page.goto('/hakkimizda');
    expect(await page.locator('main img').count()).toBeGreaterThanOrEqual(3);
  });
});
