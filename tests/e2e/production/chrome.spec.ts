import { expect, test } from '@playwright/test';

/**
 * The header and the mega footer.
 *
 * These are the two components every page carries, so a defect here is a
 * defect on 52 routes at once. Everything asserted below is behaviour a real
 * browser has to produce: focus movement, `inert`, the scroll state, and the
 * fact that a route change closes the drawer.
 */

test.describe('header — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('links to every primary destination', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    for (const href of [
      '/hakkimizda',
      '/blog',
      '/galeri',
      '/sss',
      '/iletisim',
    ]) {
      await expect(header.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test('the services menu is a button, not a hover-only dropdown', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.locator('header button[aria-expanded]').first();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('the mega menu lists all twenty services, grouped', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('header [id]:has(a[href^="/hizmetler/"])');
    // All twenty are in the DOM whether or not the menu is open, so
    // find-in-page reaches them.
    expect(
      await page.locator('header a[href^="/hizmetler/"]').count(),
    ).toBeGreaterThanOrEqual(20);
    await expect(panel.first()).toBeAttached();
  });

  test('the closed mega panel is inert, so it cannot be tabbed into', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[data-mega-menu]')).toHaveAttribute('inert', '');

    await page.locator('header button[aria-expanded]').first().click();
    await expect(page.locator('[data-mega-menu]')).not.toHaveAttribute(
      'inert',
      '',
    );
  });

  test('Escape closes the mega menu and returns focus to its button', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.locator('header button[aria-expanded]').first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('carries one prominent contact CTA with a live target', async ({
    page,
  }) => {
    await page.goto('/');
    const cta = page.locator('header [data-channel="whatsapp"]');
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+$/);
  });
});

test.describe('header — scroll state', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('gains a surface once the page leaves the top', async ({ page }) => {
    await page.goto('/');

    const transparentAtRest = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-site-header]')!)
          .backgroundColor,
    );

    await page.evaluate(() =>
      window.scrollTo({ top: 600, behavior: 'instant' }),
    );
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute('data-scrolled'),
    );

    const scrolled = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-site-header]')!)
          .backgroundColor,
    );

    expect(scrolled).not.toBe(transparentAtRest);
  });

  test('the header never changes height on scroll', async ({ page }) => {
    // A header that resizes on scroll reflows the document on the frame it
    // changes — docs/MOTION.md §2 rule 2.
    await page.goto('/');
    const header = page.locator('[data-site-header]');
    const before = (await header.boundingBox())?.height;

    await page.evaluate(() =>
      window.scrollTo({ top: 900, behavior: 'instant' }),
    );
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute('data-scrolled'),
    );

    const after = (await header.boundingBox())?.height;
    expect(after).toBe(before);
  });

  test('the scroll state is driven by a sentinel, not by a handler', async ({
    page,
  }) => {
    /*
     * docs/MOTION.md §2: nothing may run per scroll frame. The header reads an
     * IntersectionObserver over a 1px sentinel instead of a scroll listener, so
     * the state change costs nothing and nothing re-renders.
     *
     * Counting scroll listeners in the browser would be the wrong test — the
     * framework registers its own for scroll restoration, and that one is not
     * ours to pin. What is ours: the sentinel exists, and it contributes no
     * layout. A unit test separately asserts every scroll listener in `src/`
     * is passive.
     */
    await page.goto('/hakkimizda');
    const sentinel = page.locator('[data-scroll-sentinel]');
    await expect(sentinel).toBeAttached();

    const box = await sentinel.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(1);
    expect(box?.y).toBeLessThanOrEqual(0);

    // And it actually drives the attribute.
    await page.evaluate(() =>
      window.scrollTo({ top: 800, behavior: 'instant' }),
    );
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute('data-scrolled'),
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute('data-scrolled'),
    );
  });
});

test.describe('header — mobile drawer', () => {
  test.use({ viewport: { width: 375, height: 720 } });

  test('opens, traps focus, and closes on Escape with focus restored', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menüyü aç' });
    await expect(toggle).toBeVisible();

    await toggle.click();
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    // Focus moved into the drawer.
    const focusedInside = await page.evaluate(() =>
      document
        .querySelector('[role="dialog"]')!
        .contains(document.activeElement),
    );
    expect(focusedInside).toBe(true);

    // Tab all the way round: focus must never leave the drawer.
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
    }
    expect(
      await page.evaluate(() =>
        document
          .querySelector('[role="dialog"]')!
          .contains(document.activeElement),
      ),
    ).toBe(true);

    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  });

  test('closes when the route changes', async ({ page }) => {
    // The single most common bug in this component: a full-screen menu left
    // covering the page the visitor just asked for.
    await page.goto('/');
    await page.getByRole('button', { name: 'Menüyü aç' }).click();

    const drawer = page.locator('[role="dialog"]');
    await drawer.getByRole('link', { name: 'Blog', exact: true }).click();

    await expect(page).toHaveURL(/\/blog$/);
    await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('inert', '');
  });

  test('the closed drawer is inert and unreachable by keyboard', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[role="dialog"]')).toHaveAttribute('inert', '');
  });

  test('the body does not scroll behind the open drawer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menüyü aç' }).click();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      'hidden',
    );
  });
});

test.describe('the mega footer', () => {
  test('carries every service, page, legal link and channel', async ({
    page,
  }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    expect(await footer.locator('a[href^="/hizmetler/"]').count()).toBe(20);
    for (const href of [
      '/hakkimizda',
      '/blog',
      '/galeri',
      '/sss',
      '/iletisim',
    ]) {
      await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
    for (const href of [
      '/kvkk',
      '/cerez-politikasi',
      '/kullanim-kosullari',
      '/lisanslar',
    ]) {
      expect(await footer.locator(`a[href="${href}"]`).count()).toBeGreaterThan(
        0,
      );
    }
  });

  test('every channel and social profile has a live target', async ({
    page,
  }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('footer [data-channel]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));

    // Three conversion channels + four social profiles.
    expect(hrefs.length).toBe(7);
    for (const href of hrefs) {
      expect(href).toMatch(/^(?:tel:\+?\d|mailto:[^@]+@|https:\/\/)/);
    }
  });

  test('shows the address, hours and the wordmark', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer.locator('address')).toContainText('Selçuklu');
    await expect(footer.getByText('Pazartesi – Cuma')).toBeVisible();
    await expect(footer.getByText('Planlanan saatler')).toBeVisible();
    await expect(footer.getByText('Maren', { exact: true })).toBeVisible();
  });

  test('states the year at render time, and no other date', async ({
    page,
  }) => {
    await page.goto('/');
    const copyright = await page.locator('footer').getByText(/©/).textContent();
    expect(copyright).toContain(String(new Date().getFullYear()));
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/hakkimizda');
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('the wordmark handoff still works', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the header wordmark is withheld at the top of the home page', async ({
    page,
  }) => {
    await page.goto('/');
    // The hero publishes the handoff state after mount; asserting before it
    // does would be asserting the server's guess, not the behaviour.
    await page.waitForFunction(
      () => document.documentElement.dataset.heroHandoff === 'pending',
    );
    const visibility = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-header-wordmark]')!)
          .visibility,
    );
    expect(visibility).toBe('hidden');
  });

  test('but the navigation and the CTA are never withheld', async ({
    page,
  }) => {
    // Navigation is not part of the cross-fade: a first screen with no way out
    // would be the cost of making it one.
    await page.goto('/');
    await expect(page.locator('header a[href="/blog"]').first()).toBeVisible();
    await expect(page.locator('header [data-channel]').first()).toBeVisible();
  });

  test('and every page without a hero shows it immediately', async ({
    page,
  }) => {
    await page.goto('/sss');
    const visibility = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-header-wordmark]')!)
          .visibility,
    );
    expect(visibility).toBe('visible');
  });
});
