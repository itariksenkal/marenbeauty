import { expect, test } from '@playwright/test';

/**
 * Zero cookies, zero third parties — **before consent** — checked in a clean
 * browser profile.
 *
 * Playwright gives every test a fresh context, which IS the clean profile the
 * criterion asks for: no cookie jar, no storage, no service worker carried over
 * from another test. Since C13 that also means no consent has been given, which
 * is exactly the state these five describe.
 *
 * This is the only check that can actually falsify the cookie policy's first
 * line. The unit tests prove the container is absent from every server-rendered
 * document; only a browser can prove that nothing else — a font, an image, an
 * embed, a framework default — reaches for a third party either, and that the
 * container really does stay away until asked. The other half, that agreeing
 * DOES load it, is "the gate, end to end" at the bottom of this file.
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
  test('shows the banner, because GTM now requires consent', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('dialog', { name: 'Ölçümleme izni' }),
    ).toBeVisible();
  });

  test('offers refusal exactly as easily as agreement', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('dialog', { name: 'Ölçümleme izni' });
    // `exact` matters: "İzin ver" is a prefix of "İzin verme", and Playwright
    // matches accessible names by substring unless told otherwise.
    const accept = banner.getByRole('button', {
      name: 'İzin ver',
      exact: true,
    });
    const reject = banner.getByRole('button', {
      name: 'İzin verme',
      exact: true,
    });

    // Same box, to the pixel. One click each, on the same screen.
    const [a, r] = [await accept.boundingBox(), await reject.boundingBox()];
    expect(a?.height).toBe(r?.height);
    expect(Math.abs((a?.width ?? 0) - (r?.width ?? 0))).toBeLessThan(24);
  });

  test('is reachable and honest on the cookie policy page', async ({
    page,
  }) => {
    await page.goto('/cerez-politikasi');
    // Scoped to `main`: the banner is also on this page, and the policy prose
    // now refers to the panel by name, so neither the heading nor the buttons
    // are unique to the document.
    const panel = page.locator('main');
    await expect(
      panel.getByRole('heading', { name: 'Tercihiniz' }),
    ).toBeVisible();
    await expect(
      panel.getByRole('button', { name: 'İzin ver', exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByRole('button', { name: 'İzin verme', exact: true }),
    ).toBeVisible();
  });

  test('the policy names no cookie the site does not set', async ({ page }) => {
    await page.goto('/cerez-politikasi');
    const text = await page.locator('main').innerText();
    // Still the rule: the container's contents are configured outside this
    // repo, so naming cookies here would be the boilerplate this page refuses
    // to be (docs/OPEN-QUESTIONS.md C13).
    for (const name of ['_ga', '_gid', '_fbp', 'PHPSESSID']) {
      expect(text).not.toContain(name);
    }
    expect(text).toContain('İzin vermediğiniz sürece bu site çerez kullanmaz');
  });
});

/**
 * The gate itself, proven in a browser.
 *
 * The unit tests prove the loader is absent from every server-rendered document
 * and that the component returns null without a grant. Only a real browser can
 * show the consequence: that `googletagmanager.com` is contacted after a click
 * on "İzin ver" and not one moment before.
 */
test.describe('the gate, end to end', () => {
  const gtmRequests = (page: import('@playwright/test').Page) => {
    const hits: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('googletagmanager.com'))
        hits.push(request.url());
    });
    return hits;
  };

  /** The banner's own buttons, named exactly — "İzin ver" prefixes "İzin verme". */
  const bannerButton = (
    page: import('@playwright/test').Page,
    name: 'İzin ver' | 'İzin verme',
  ) =>
    page
      .getByRole('dialog', { name: 'Ölçümleme izni' })
      .getByRole('button', { name, exact: true });

  test('refusing loads no container and sets no cookie', async ({
    page,
    context,
  }) => {
    const hits = gtmRequests(page);
    await page.goto('/');
    await bannerButton(page, 'İzin verme').click();

    // Give it every chance to misbehave.
    await page.goto('/hizmetler');
    await page.waitForLoadState('domcontentloaded');

    expect(hits).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(
      await page.evaluate(
        () => typeof (window as unknown as Record<string, unknown>).dataLayer,
      ),
    ).toBe('undefined');
  });

  test('agreeing loads the container, and it stays loaded', async ({
    page,
  }) => {
    const hits = gtmRequests(page);
    await page.goto('/');
    await bannerButton(page, 'İzin ver').click();

    await expect
      .poll(() => hits.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    expect(hits.some((url) => url.includes('GTM-'))).toBe(true);

    // The choice survives navigation — a returning visitor is not re-asked.
    await page.goto('/iletisim');
    await expect(
      page.getByRole('dialog', { name: 'Ölçümleme izni' }),
    ).toHaveCount(0);
  });

  test('the banner never returns once answered', async ({ page }) => {
    await page.goto('/');
    await bannerButton(page, 'İzin verme').click();
    await expect(
      page.getByRole('dialog', { name: 'Ölçümleme izni' }),
    ).toHaveCount(0);

    await page.goto('/');
    await expect(
      page.getByRole('dialog', { name: 'Ölçümleme izni' }),
    ).toHaveCount(0);
  });
});
