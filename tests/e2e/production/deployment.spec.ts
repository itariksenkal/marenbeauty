import { expect, test } from '@playwright/test';

/**
 * Push-to-deploy readiness, checked against the real production server.
 *
 * Everything here is something that only exists correctly once the site is
 * actually served: a header, a generated file, a feed a reader will parse.
 * Asserting any of it from source would assert the intention.
 */

const GENERATED: readonly [string, string][] = [
  ['/robots.txt', 'Sitemap: https://marenbeauty.com/sitemap.xml'],
  ['/sitemap.xml', '<loc>https://marenbeauty.com/hizmetler/hydrafacial</loc>'],
  ['/manifest.webmanifest', '"display":"browser"'],
  ['/humans.txt', 'Maren Beauty'],
  ['/llms.txt', 'beauty centre, not a medical clinic'],
  ['/.well-known/security.txt', 'Contact: mailto:info@marenbeauty.com'],
  ['/icon.svg', '<svg'],
];

test.describe('generated files', () => {
  for (const [path, contains] of GENERATED) {
    test(`${path} is served and correct`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain(contains);
    });
  }

  test('security.txt has not expired', async ({ request }) => {
    // RFC 9116 requires `Expires`, and an expired file is worse than none:
    // it tells a researcher the contact is stale.
    const text = await (await request.get('/.well-known/security.txt')).text();
    const expires = text.match(/Expires:\s*(\S+)/)?.[1];
    expect(expires).toBeTruthy();
    expect(new Date(expires!).getTime()).toBeGreaterThan(Date.now());
  });
});

test.describe('the RSS feed', () => {
  test('parses, lists every published post, and links absolutely', async ({
    request,
  }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/rss+xml');

    const xml = await response.text();
    expect((xml.match(/<item>/g) ?? []).length).toBe(12);

    // Every link is absolute and points at production, never at the test host.
    for (const link of xml.match(/<link>([^<]+)<\/link>/g) ?? []) {
      expect(link).toContain('https://marenbeauty.com');
    }
    expect(xml).toContain('<atom:link');
    expect(xml).toContain('<language>tr-TR</language>');
  });

  test('carries summaries, not whole articles', async ({ request }) => {
    // A feed that ships the body is a second copy of every page — a duplicate
    // for a crawler, and a way to read a post without the disclaimer the
    // template renders around it.
    const xml = await (await request.get('/rss.xml')).text();
    const descriptions = xml.match(/<description>[^<]*<\/description>/g) ?? [];
    expect(descriptions.length).toBeGreaterThan(10);
    expect(Math.max(...descriptions.map((d) => d.length))).toBeLessThan(400);
  });

  test('lists no draft', async ({ request }) => {
    const xml = await (await request.get('/rss.xml')).text();
    expect(xml).not.toContain('sablon-onizleme');
  });
});

/**
 * Security headers are set in `next.config.ts`, NOT in `vercel.json`.
 *
 * Headers configured on the platform apply only on that platform, and the
 * container has to serve the same site (CLAUDE.md §3). These tests run against
 * `next start`, which is the code path the container uses — so a header that
 * only worked on Vercel would fail here.
 */
test.describe('security headers', () => {
  test('every one is present on a page response', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
    expect(headers['permissions-policy']).toContain('geolocation=()');
    // Next's own header, disabled in next.config.ts.
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('fingerprinted assets are immutable, images deliberately are not', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const asset = await page
      .locator('script[src^="/_next/static"], link[href^="/_next/static"]')
      .first()
      .evaluate(
        (el) => el.getAttribute('src') ?? el.getAttribute('href') ?? '',
      );
    expect(asset).toBeTruthy();

    const assetHeaders = (await request.get(asset)).headers();
    expect(assetHeaders['cache-control']).toContain('immutable');

    // Image paths are stable so the whole set can be swapped in one file
    // (`src/config/images.ts`), so they must NOT be immutable — a year of
    // browser cache would outlive the real photography.
    const imageHeaders = (
      await request.get('/images/services/hydrafacial.webp')
    ).headers();
    expect(imageHeaders['cache-control']).not.toContain('immutable');
    expect(imageHeaders['cache-control']).toContain('stale-while-revalidate');
  });
});

test.describe('nothing internal is reachable', () => {
  test('the dev-only surfaces all 404', async ({ request }) => {
    for (const route of ['/styleguide', '/motion', '/api/dev/outbox']) {
      expect((await request.get(route)).status(), route).toBe(404);
    }
  });

  test('no env file or repository file is served', async ({ request }) => {
    for (const path of ['/.env', '/.env.local', '/package.json', '/NOTICE']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});
