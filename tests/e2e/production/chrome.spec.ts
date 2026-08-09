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

  /**
   * The surface is painted on `[data-site-header]::before`, not on the header,
   * so this reads the pseudo-element. That is not an implementation detail the
   * test is chasing: `backdrop-filter` on the header itself would make it the
   * containing block for the `fixed` mobile drawer inside it, which is the bug
   * recorded as G38. The last assertion pins that invariant where the surface
   * is defined — the drawer's own test covers the consequence.
   */
  test('gains a surface once the page leaves the top', async ({ page }) => {
    await page.goto('/');

    const read = () =>
      page.evaluate(() => {
        const header = document.querySelector('[data-site-header]')!;
        const surface = getComputedStyle(header, '::before');
        const own = getComputedStyle(header);
        return {
          opacity: surface.opacity,
          background: surface.backgroundColor,
          blur: surface.backdropFilter,
          ownBlur: own.backdropFilter,
          ownFilter: own.filter,
          ownTransform: own.transform,
        };
      });

    const atRest = await read();
    expect(atRest.opacity).toBe('0');

    await page.evaluate(() =>
      window.scrollTo({ top: 600, behavior: 'instant' }),
    );
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute('data-scrolled'),
    );

    /*
     * WAIT FOR THE END STATE, DO NOT SLEEP FOR THE DURATION. The transition is
     * 220ms of wall clock, but `getComputedStyle` reports the value as of the
     * last painted frame, and a 10px backdrop blur over the animating aurora
     * paints slowly enough on a loaded CI box that a 400ms sleep still read
     * 0. The assertion is about the state the header settles in.
     */
    await page.waitForFunction(
      () =>
        getComputedStyle(
          document.querySelector('[data-site-header]')!,
          '::before',
        ).opacity === '1',
    );

    const scrolled = await read();
    expect(scrolled.opacity).toBe('1');
    expect(scrolled.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(scrolled.blur).toContain('blur');

    // Nothing on the header itself may create a containing block for `fixed`.
    expect(scrolled.ownBlur).toBe('none');
    expect(scrolled.ownFilter).toBe('none');
    expect(scrolled.ownTransform).toBe('none');
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

/**
 * Every locator here is `[data-mobile-drawer]`, not `[role="dialog"]`.
 *
 * Since C13 the consent banner is also a `role="dialog"`, so the bare role
 * matched two elements and Playwright's strict mode failed the assertion rather
 * than picking one. The attribute is what the drawer already carries to
 * identify itself, and scoping to it says which dialog is meant.
 */
test.describe('header — mobile drawer', () => {
  test.use({ viewport: { width: 375, height: 720 } });

  test('opens, traps focus, and closes on Escape with focus restored', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menüyü aç' });
    await expect(toggle).toBeVisible();

    await toggle.click();
    const drawer = page.locator('[data-mobile-drawer]');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    // Focus moved into the drawer.
    const focusedInside = await page.evaluate(() =>
      document
        .querySelector('[data-mobile-drawer]')!
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
          .querySelector('[data-mobile-drawer]')!
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

    const drawer = page.locator('[data-mobile-drawer]');
    await drawer.getByRole('link', { name: 'Blog', exact: true }).click();

    await expect(page).toHaveURL(/\/blog$/);
    await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('inert', '');
  });

  test('the closed drawer is inert and unreachable by keyboard', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('[data-mobile-drawer]')).toHaveAttribute(
      'inert',
      '',
    );
  });

  test('the body does not scroll behind the open drawer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menüyü aç' }).click();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      'hidden',
    );
  });

  /**
   * The drawer is `position: fixed` and lives inside the header, so anything
   * on the header that creates a containing block for fixed descendants —
   * `transform`, `filter`, `backdrop-filter`, `will-change`, `contain: paint`
   * — silently re-parents it. The scrolled header's `backdrop-filter` did
   * exactly that: at the top of the page the drawer opened 375×720, and one
   * screen down it opened 375×70, an empty strip with the menu clipped off
   * (docs/OPEN-QUESTIONS.md G38).
   *
   * Asserted at BOTH scroll positions, because the bug only exists at one of
   * them, and against the viewport rather than against a pixel count.
   */
  test('fills the viewport whether or not the page has been scrolled', async ({
    page,
  }) => {
    await page.goto('/');

    for (const scrollY of [0, 900]) {
      await page.evaluate(
        (y) => window.scrollTo({ top: y, behavior: 'instant' }),
        scrollY,
      );
      await page.waitForTimeout(400);

      await page.getByRole('button', { name: 'Menüyü aç' }).click();
      await page.waitForTimeout(400);

      const box = await page.evaluate(() => {
        const r = document
          .querySelector('[data-mobile-drawer]')!
          .getBoundingClientRect();
        return {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          vw: window.innerWidth,
          vh: window.innerHeight,
        };
      });

      expect(box.top, `top at scrollY=${scrollY}`).toBe(0);
      expect(box.left, `left at scrollY=${scrollY}`).toBe(0);
      expect(box.width, `width at scrollY=${scrollY}`).toBe(box.vw);
      expect(box.height, `height at scrollY=${scrollY}`).toBe(box.vh);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  /**
   * The drawer's content is twice a phone screen tall, and the header's own
   * toggle is underneath it — z-overlay sits above z-header. So this button is
   * the only close control a pointer can reach, and it has to stay reachable
   * from anywhere in the list (docs/OPEN-QUESTIONS.md G39).
   */
  test('the close control stays on screen while the menu is scrolled', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menüyü aç' }).click();

    const overflows = await page.evaluate(() => {
      const drawer = document.querySelector('[data-mobile-drawer]')!;
      return drawer.scrollHeight > drawer.clientHeight;
    });
    expect(overflows, 'the drawer no longer scrolls — retune this test').toBe(
      true,
    );

    await page.evaluate(() => {
      const drawer = document.querySelector('[data-mobile-drawer]')!;
      drawer.scrollTo({ top: drawer.scrollHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(400);

    const close = page
      .locator('[data-mobile-drawer]')
      .getByRole('button', { name: 'Menüyü kapat' });
    await expect(close).toBeInViewport();

    // And it still closes from down there.
    await close.click();
    await expect(page.locator('[data-mobile-drawer]')).toHaveAttribute(
      'inert',
      '',
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
    const links = await page
      .locator('footer [data-channel]')
      .evaluateAll((els) =>
        els.map((el) => ({
          channel: el.getAttribute('data-channel') ?? '',
          href: el.getAttribute('href') ?? '',
        })),
      );

    expect(links.length).toBeGreaterThan(0);
    for (const { channel, href } of links) {
      expect(href, channel).toMatch(/^(?:tel:\+?\d|mailto:[^@]+@|https:\/\/)/);
    }

    // The SET rather than a count: WhatsApp legitimately appears twice — once
    // as a way to start a conversation and once in the follow row — and a
    // hardcoded total turns that into a failure the next time the row changes.
    expect(new Set(links.map((l) => l.channel))).toEqual(
      new Set([
        'whatsapp',
        'phone',
        'email',
        'instagram',
        'facebook',
        'tiktok',
        'x',
      ]),
    );
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

test.describe('the header logo', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the logo is in the corner at the top of the home page', async ({
    page,
  }) => {
    // It used to be withheld until the hero handed off. The owner asked for it
    // from first paint (docs/OPEN-QUESTIONS.md G33).
    await page.goto('/');
    await expect(page.locator('[data-header-wordmark]')).toBeVisible();
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
