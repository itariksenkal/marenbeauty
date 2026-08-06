import { expect, test } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The post template, driven in development against the draft preview.
 *
 * This file exists because of a coverage hole that would otherwise be total:
 * with no published posts, `/blog/[slug]` generates **zero pages** in
 * production, so no production test can load the template at all and
 * `npm run verify` would stay green over a completely broken one. The same
 * class of gap as `/styleguide` at M5 (docs/OPEN-QUESTIONS.md G13).
 *
 * `draft: true` is honoured only outside production, so the preview has a route
 * here and none in the build that ships — which the production suite asserts
 * from the other side.
 *
 * Deleted at M10, when twelve real posts make it redundant.
 */

const PREVIEW = '/blog/sablon-onizleme';

test.describe('post template preview', () => {
  test('renders with no runtime error and exactly one h1', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    const response = await page.goto(PREVIEW);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('renders every block of the §6 structure', async ({ page }) => {
    await page.goto(PREVIEW);
    await expect(page.getByRole('heading', { name: 'Kısaca' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Sık sorulan sorular' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'İlgili hizmet', exact: true }),
    ).toBeVisible();
    // The mapped service hub — the "up" link of the linking map.
    await expect(
      page.locator('a[href="/hizmetler/cilt-bakimi"]').first(),
    ).toBeVisible();
  });

  test('shows no byline of any kind', async ({ page }) => {
    await page.goto(PREVIEW);
    const body = (await page.locator('body').textContent()) ?? '';
    for (const word of ['PENDING', 'Admin', 'Editör', 'Yazar']) {
      expect(body, word).not.toContain(word);
    }
    // Nor an empty avatar standing in for one.
    expect(await page.locator('[data-author], .author').count()).toBe(0);
  });

  test('carries exactly one call to action, and it goes to /iletisim', async ({
    page,
  }) => {
    await page.goto(PREVIEW);
    // Scoped to <main>: the footer's navigation link is not a CTA.
    const ctas = page.locator('main a[href="/iletisim"]');
    await expect(ctas).toHaveCount(1);
  });

  test('related posts render nothing while the post is alone', async ({
    page,
  }) => {
    await page.goto(PREVIEW);
    expect(
      await page.getByRole('heading', { name: 'İlgili yazılar' }).count(),
    ).toBe(0);
  });

  test('heading levels do not skip, body subheadings included', async ({
    page,
  }) => {
    await page.goto(PREVIEW);
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

  test('the FAQ opens, with no JavaScript involved', async ({ page }) => {
    await page.goto(PREVIEW);
    const first = page.locator('details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });

  test('a draft still stays out of the listing, even here', async ({
    page,
  }) => {
    // Development shows the ROUTE, not the post. "Absent from every listing"
    // is not conditional on the environment.
    await page.goto('/blog');
    const html = await page.content();
    expect(html).not.toContain('sablon-onizleme');
  });

  test('and declares itself noindex, in case a preview URL escapes', async ({
    page,
  }) => {
    await page.goto(PREVIEW);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(PREVIEW);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
