import { expect, test } from '@playwright/test';

/**
 * Zero cookies, zero third parties — checked in a clean browser profile.
 *
 * Playwright gives every test a fresh context, which IS the clean profile the
 * criterion asks for: no cookie jar, no storage, no service worker carried over
 * from another test.
 *
 * This is the only check that can actually falsify the cookie policy's first
 * line. The unit tests prove the flags are off and the tracker code is absent
 * from the build; only a browser can prove that nothing else — a font, an
 * image, an embed, a framework default — reaches for a third party either.
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
  '/cerez-politikasi',
];

test.describe('a clean profile stays clean', () => {
  test('sets no cookie anywhere on the site', async ({ page, context }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }
    expect(await context.cookies()).toEqual([]);
  });

  test('makes no request to any third-party host', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const { hostname } = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(hostname)) {
        external.push(request.url());
      }
    });

    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }
    expect(external).toEqual([]);
  });

  test('writes nothing to localStorage or sessionStorage', async ({ page }) => {
    // The consent choice is the only thing this site would ever store, and it
    // is written only when a visitor makes one. With nothing to consent to,
    // nothing is stored — which is what the cookie policy says.
    await page.goto('/cerez-politikasi');
    await page.waitForLoadState('networkidle');

    const storage = await page.evaluate(() => ({
      local: Object.keys(window.localStorage),
      session: Object.keys(window.sessionStorage),
    }));
    expect(storage.local).toEqual([]);
    expect(storage.session).toEqual([]);
  });

  test('loads no gtag, fbq or dataLayer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const globals = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return {
        gtag: typeof w.gtag,
        fbq: typeof w.fbq,
        dataLayer: typeof w.dataLayer,
      };
    });
    expect(globals).toEqual({
      gtag: 'undefined',
      fbq: 'undefined',
      dataLayer: 'undefined',
    });
  });

  test('registers no service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const registrations = await page.evaluate(async () =>
      navigator.serviceWorker
        ? (await navigator.serviceWorker.getRegistrations()).length
        : 0,
    );
    expect(registrations).toBe(0);
  });
});

test.describe('the consent surface', () => {
  test('shows no banner, because nothing requires consent', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('dialog', { name: 'Ölçümleme izni' }),
    ).toHaveCount(0);
  });

  test('is still reachable and honest on the cookie policy page', async ({
    page,
  }) => {
    await page.goto('/cerez-politikasi');
    await expect(page.getByText('Tercihiniz')).toBeVisible();
    await expect(
      page.getByText('Şu anda izin gerektiren bir araç kullanılmıyor'),
    ).toBeVisible();
  });

  test('the policy names no cookie the site does not set', async ({ page }) => {
    await page.goto('/cerez-politikasi');
    const text = await page.locator('main').innerText();
    for (const name of ['_ga', '_gid', '_fbp', 'PHPSESSID']) {
      expect(text).not.toContain(name);
    }
    expect(text).toContain('Bu site çerez kullanmıyor');
  });
});
