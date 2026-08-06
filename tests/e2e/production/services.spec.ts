import { expect, test, type Page } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The twenty service pages.
 *
 * These assert what only a real render can show: that every generated route
 * actually responds, that the placeholder images resolve through the optimiser
 * rather than 404ing, and that the View Transition name is unique in the
 * document AT CAPTURE TIME — which is the one condition that makes the
 * transition silently do nothing when it is broken.
 */

/** Kept in step with content/services/*.mdx by a unit test, not by hand. */
const SLUGS = [
  'cilt-bakimi',
  'akne-bakimi',
  'yaslanma-karsiti-bakim',
  'leke-bakimi',
  'hassas-cilt-bakimi',
  'kolajen-bakimi',
  'nemlendirme-bakimi',
  'gozenek-sikilastirma',
  'hucre-yenileme',
  'lazer-epilasyon',
  'hydrafacial',
  'karbon-peeling',
  'kimyasal-peeling',
  'dermapen',
  'bb-glow',
  'kalici-makyaj',
  'microblading',
  'kirpik-lifting',
  'kas-tasarimi',
  'gelin-bakim-paketi',
];

/**
 * Every `view-transition-name` in the document, EXCEPT the root.
 *
 * The user agent puts `view-transition-name: root` on `<html>` itself, so a
 * naive sweep always reports one name and hides the thing being tested. This is
 * about the names we set.
 */
const namedElements = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => el !== document.documentElement)
      .map((el) => getComputedStyle(el).viewTransitionName)
      .filter((name) => name && name !== 'none'),
  );

test.describe('service index', () => {
  test('renders all 20 cards with no runtime error', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    await page.goto('/hizmetler');
    await page.waitForLoadState('networkidle');

    // Scoped to <main>: from M19 the header mega menu and the footer both
    // link to all twenty as well, which is the point of them.
    const cards = page.locator('main a[href^="/hizmetler/"]');
    await expect(cards).toHaveCount(SLUGS.length);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('every card points at a distinct, real service', async ({ page }) => {
    await page.goto('/hizmetler');
    const hrefs = await page
      .locator('main a[href^="/hizmetler/"]')
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute('href') ?? ''),
      );
    expect(new Set(hrefs).size).toBe(SLUGS.length);
    for (const slug of SLUGS) {
      expect(hrefs).toContain(`/hizmetler/${slug}`);
    }
  });

  test('no card carries a view-transition-name at rest', async ({ page }) => {
    // The name is unique-per-document. Applying it to twenty cards up front is
    // the classic way to make the transition do nothing at all.
    await page.goto('/hizmetler');
    expect(await namedElements(page)).toEqual([]);
  });

  test('every manifest image resolves to a real file', async ({ page }) => {
    // Requested directly rather than measured in the page: below-the-fold
    // images are lazy, so `naturalWidth` reports 0 for reasons that have
    // nothing to do with whether the file exists.
    for (const slug of SLUGS) {
      const response = await page.request.get(`/images/services/${slug}.webp`);
      expect(response.status(), slug).toBe(200);
    }
  });

  test('the images above the fold decode, through the optimiser', async ({
    page,
  }) => {
    await page.goto('/hizmetler');
    await page.waitForLoadState('networkidle');
    const first = page.locator('img').first();
    await expect(first).toHaveJSProperty('complete', true);
    expect(
      await first.evaluate((img) => (img as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
    // `next/image` is doing the work, not a raw <img src>.
    expect(await first.getAttribute('src')).toContain('/_next/image');
  });

  /**
   * The launch set became real photography at M18, so the answer flipped:
   * empty alt was correct for abstract artwork that carried no information,
   * and is wrong for a photograph that does. Every card image now announces
   * itself, and none of them is `aria-hidden`.
   */
  test('every card image announces itself in Turkish', async ({ page }) => {
    await page.goto('/hizmetler');
    const images = await page.locator('img').evaluateAll((els) =>
      els.map((el) => ({
        alt: (el as HTMLImageElement).alt,
        hidden: el.getAttribute('aria-hidden'),
      })),
    );

    expect(images.length).toBe(20);
    for (const image of images) {
      expect(image.alt.length).toBeGreaterThan(15);
      expect(image.hidden).toBeNull();
    }
  });
});

test.describe('service detail', () => {
  test('all 20 routes respond', async ({ page }) => {
    for (const slug of SLUGS) {
      const response = await page.goto(`/hizmetler/${slug}`);
      expect(response?.status(), slug).toBe(200);
    }
  });

  test('exactly one element carries the hero transition name', async ({
    page,
  }) => {
    await page.goto('/hizmetler/cilt-bakimi');
    expect(await namedElements(page)).toEqual(['service-hero']);
  });

  test('the name is unique in the document at capture time', async ({
    page,
  }) => {
    // The real failure mode is a duplicate name at the moment the browser
    // snapshots the page. Intercepting startViewTransition is the only way to
    // sample that moment; asserting on the markup afterwards would miss it.
    await page.addInitScript(() => {
      const target = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };
      const original = target.startViewTransition?.bind(document);
      if (!original) return;
      (window as unknown as { __capturedNames: string[][] }).__capturedNames =
        [];
      target.startViewTransition = (callback: () => void) => {
        (
          window as unknown as { __capturedNames: string[][] }
        ).__capturedNames.push(
          [...document.querySelectorAll('*')]
            .filter((el) => el !== document.documentElement)
            .map((el) => getComputedStyle(el).viewTransitionName)
            .filter((name) => name && name !== 'none'),
        );
        return original(callback);
      };
    });

    await page.goto('/hizmetler');
    await page.locator('main a[href="/hizmetler/hydrafacial"]').click();
    await expect(page).toHaveURL(/\/hizmetler\/hydrafacial$/);

    const captured = await page.evaluate(
      () =>
        (window as unknown as { __capturedNames?: string[][] })
          .__capturedNames ?? [],
    );
    // Chromium supports View Transitions, so this must have fired.
    expect(captured.length).toBeGreaterThan(0);
    expect(captured[0]).toEqual(['service-hero']);
  });

  test('publishes no duration and no price', async ({ page }) => {
    for (const slug of ['lazer-epilasyon', 'dermapen', 'gelin-bakim-paketi']) {
      await page.goto(`/hizmetler/${slug}`);
      const body = (await page.locator('body').textContent()) ?? '';
      expect(body, slug).not.toMatch(/\bSüre\b/);
      expect(body, slug).not.toMatch(/\d+\s*(dakika|dk|seans|hafta)/i);
      expect(body, slug).not.toMatch(/₺|\bTL\b/);
    }
  });

  test('carries the disclaimer', async ({ page }) => {
    await page.goto('/hizmetler/kimyasal-peeling');
    await expect(
      page.getByText(
        'Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.',
      ),
    ).toBeVisible();
  });

  test('no channel link is dead here either', async ({ page }) => {
    await page.goto('/hizmetler/hydrafacial');
    const hrefs = await page
      .locator('[data-channel]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^(?:tel:\+?\d|mailto:[^@]+@|https:\/\/)/);
    }
    expect(
      await page.locator('a[href="tel:"], a[href="mailto:"]').count(),
    ).toBe(0);
    expect(await page.locator('a[href="#"]').count()).toBe(0);
    expect(
      await page.locator('button[disabled], a[aria-disabled="true"]').count(),
    ).toBe(0);
  });

  test('the FAQ opens without JavaScript-driven layout surprises', async ({
    page,
  }) => {
    await page.goto('/hizmetler/lazer-epilasyon');
    const first = page.locator('details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });

  test('both related blocks render now that Batch 1 exists', async ({
    page,
  }) => {
    // Until M10 the posts block was absent, and that absence was the
    // assertion. Twelve posts later it renders — for the twelve services a
    // Batch 1 post maps to.
    await page.goto('/hizmetler/cilt-bakimi');
    await expect(
      page.getByRole('heading', { name: 'İlgili hizmetler' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'İlgili yazılar' }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/blog/cilt-bakimi-nedir"]'),
    ).toBeVisible();
  });

  test('a service with no Batch 1 post shows no posts block', async ({
    page,
  }) => {
    // `bb-glow` is Batch 2. Absence, not an empty heading — the same rule the
    // block followed when nothing at all was published.
    await page.goto('/hizmetler/bb-glow');
    expect(
      await page.getByRole('heading', { name: 'İlgili yazılar' }).count(),
    ).toBe(0);
  });

  test('heading levels do not skip', async ({ page }) => {
    await page.goto('/hizmetler/kalici-makyaj');
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) =>
        Number(el.tagName.slice(1)),
      ),
    );
    expect(levels[0]).toBe(1);
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) {
      expect(
        levels[i]! - levels[i - 1]!,
        `jumped from h${levels[i - 1]} to h${levels[i]}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test('no horizontal scroll at 320px, index or detail', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/hizmetler', '/hizmetler/gelin-bakim-paketi']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('an unknown slug 404s rather than rendering a shell', async ({
    page,
  }) => {
    const response = await page.goto('/hizmetler/boyle-bir-hizmet-yok');
    expect(response?.status()).toBe(404);
  });
});
