import { expect, test, type Page } from '@playwright/test';

/**
 * The measurable half of the M15 manual pass.
 *
 * Reflow at 320px, 200% zoom, and the four breakpoints in `CLAUDE.md` §19 are
 * all things a person is supposed to check by eye. They are also things a
 * browser can check exactly, on every route, on every run — so the eye is spent
 * on what only an eye can judge (reading order, focus visibility, whether the
 * motion reads as calm) and the arithmetic is spent here.
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
  '/kvkk',
  '/lisanslar',
];

const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1920', width: 1920, height: 1080 },
];

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

for (const viewport of VIEWPORTS) {
  test.describe(`at ${viewport.name}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route} does not scroll horizontally`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      });
    }
  });
}

test.describe('reflow at 200% zoom', () => {
  /**
   * WCAG 1.4.10. 200% zoom on a 1280px window is equivalent to a 640px
   * viewport — the browser reports CSS pixels, so setting the viewport is the
   * same measurement without needing a zoom API.
   */
  test.use({ viewport: { width: 640, height: 512 } });

  for (const route of ROUTES) {
    test(`${route} reflows without a horizontal scrollbar`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('nothing is clipped or hidden by the sticky header', () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test('an in-page anchor target is not covered by the header', async ({
    page,
  }) => {
    // The classic sticky-header bug: a heading linked from elsewhere lands
    // underneath it. `scroll-margin-top` on headings is what prevents it.
    await page.goto('/hizmetler/hydrafacial#sss');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('#sss');
    const box = await heading.boundingBox();
    const headerBox = await page.locator('[data-site-header]').boundingBox();

    expect(box).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
  });
});

test.describe('images reserve their space', () => {
  test('every image carries intrinsic width and height', async ({ page }) => {
    // No CLS from an image reveal is a M15 criterion, and this is its
    // precondition: without both attributes the browser cannot reserve a box.
    for (const route of ['/', '/hizmetler', '/galeri', '/hakkimizda']) {
      await page.goto(route);
      const missing = await page
        .locator('img')
        .evaluateAll((images) =>
          images
            .filter(
              (img) =>
                !img.getAttribute('width') || !img.getAttribute('height'),
            )
            .map((img) => (img as HTMLImageElement).src),
        );
      expect(missing, route).toEqual([]);
    }
  });
});
