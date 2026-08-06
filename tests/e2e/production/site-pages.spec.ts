import { expect, test } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * `/hakkimizda` and `/sss` — the two pages the header has linked to since M1
 * and which did not exist until M17.
 */
test.describe('the about page', () => {
  test('renders with exactly one h1 and no runtime error', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    const response = await page.goto('/hakkimizda');
    expect(response?.status()).toBe(200);

    await expect(page.locator('main h1')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('heading levels never skip', async ({ page }) => {
    await page.goto('/hakkimizda');
    const levels = await page
      .locator('main h1, main h2, main h3, main h4')
      .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  test('shows the visit sequence unpinned', async ({ page }) => {
    await page.goto('/hakkimizda');
    await expect(page.locator('[data-step]')).toHaveCount(4);
    // The site holds the viewport in exactly two places, and neither is here.
    expect(await page.locator('[data-pinned-sequence]').count()).toBe(0);
  });

  test('publishes no price, no rating and no before/after', async ({
    page,
  }) => {
    await page.goto('/hakkimizda');
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/\d+\s*(TL|₺)/i);
    expect(text).not.toMatch(/\d[.,]\d\s*\/\s*5|yıldız/i);
    expect(text).toContain('Öncesi–sonrası fotoğrafı yok');
  });
});

test.describe('the FAQ page', () => {
  test('renders every general question as a disclosure', async ({ page }) => {
    const response = await page.goto('/sss');
    expect(response?.status()).toBe(200);

    const questions = page.locator('#genel-sorular ~ ul details');
    await expect(questions).toHaveCount(10);
  });

  test('answers are readable without JavaScript', async ({ browser }) => {
    // Native <details>, deliberately: the disclosure works before hydration and
    // with scripting off, which a client-side accordion would not.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/sss');

    const first = page.locator('details').first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');

    await context.close();
  });

  test('links out to the services that carry their own questions', async ({
    page,
  }) => {
    await page.goto('/sss');
    const links = page.locator('main a[href^="/hizmetler/"]');
    expect(await links.count()).toBeGreaterThan(10);
  });

  test('no answer invents a date, a duration or a price', async ({ page }) => {
    await page.goto('/sss');
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/\d+\s*(dakika|seans|hafta)/i);
    expect(text).not.toMatch(/\d+\s*(TL|₺)/i);
    expect(text).not.toMatch(/20\d{2}/);
  });
});

test.describe('configured facts', () => {
  test('opening hours render and are labelled as provisional', async ({
    page,
  }) => {
    await page.goto('/iletisim');
    const location = page.locator('main address').first();
    await expect(location).toContainText('Selçuklu');

    // Scoped to <main>: the footer repeats the hours on every page.
    const main = page.locator('main');
    await expect(main.getByText('Pazartesi – Cuma')).toBeVisible();
    await expect(main.getByText('Planlanan saatler')).toBeVisible();
  });

  test('every social profile renders with a live target', async ({ page }) => {
    await page.goto('/iletisim');
    const socials = page.locator(
      '[data-channel="instagram"], [data-channel="facebook"], [data-channel="tiktok"], [data-channel="googleBusiness"]',
    );
    // The footer carries them on every page from M19; /iletisim carries the
    // conversion channels. Either way, none may be dead.
    for (const href of await socials.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    )) {
      expect(href).toMatch(/^https:\/\//);
    }
  });
});
