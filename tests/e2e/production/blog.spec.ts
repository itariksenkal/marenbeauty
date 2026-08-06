import { expect, test } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The blog in production, with Batch 1 published.
 *
 * Twelve posts is exactly one page, so this file asserts both halves of that:
 * everything is on page one, and there is still no page two. The empty-state
 * assertions from M9 are gone — they described a state the site is no longer
 * in, and a test that passes because it is checking the wrong thing is worse
 * than no test.
 */

const CATEGORIES = [
  'cilt-bakimi-rehberi',
  'cilt-yenileme-rehberi',
  'epilasyon-rehberi',
  'cilt-ihtiyaclari',
  'kas-kirpik-rehberi',
  'ozel-gun-ve-mevsim',
];

/** Batch 1 — docs/CONTENT-PLAN.md §4. One post per distinct service. */
const POSTS = [
  'lazer-epilasyon-nedir',
  'cilt-bakimi-nedir',
  'hydrafacial-nedir',
  'kimyasal-peeling-nedir',
  'dermapen-nedir',
  'kalici-makyaj-nedir',
  'microblading-nedir',
  'akne-egilimli-ciltlerde-bakim',
  'leke-gorunumu-nedenler-ve-bakim',
  'kirpik-lifting-nedir',
  'kas-tasarimi-nedir',
  'gelin-bakim-takvimi',
];

const DISCLAIMER =
  'Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.';

/** Post links, excluding the category-archive links in the pill row. */
const POST_LINKS = 'a[href^="/blog/"]:not([href*="/kategori/"])';

test.describe('blog index', () => {
  test('renders with no runtime error and exactly one h1', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    await page.goto('/blog');
    // `load`, not `networkidle`: twelve lazy-loaded card images mean the
    // network never goes quiet for the required window, and the wait times out
    // for a reason that has nothing to do with the page being broken.
    await page.waitForLoadState('load');

    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('lists all twelve posts on page one', async ({ page }) => {
    await page.goto('/blog');
    const cards = page.locator(POST_LINKS);
    await expect(cards).toHaveCount(POSTS.length);

    const hrefs = await cards.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    );
    for (const slug of POSTS) {
      expect(hrefs).toContain(`/blog/${slug}`);
    }
  });

  test('the empty state is gone now that posts exist', async ({ page }) => {
    await page.goto('/blog');
    const main = (await page.locator('main').textContent()) ?? '';
    expect(main).not.toContain('henüz yayımlanmış bir yazı yok');
  });

  test('shows no skeleton, spinner or "yakında"', async ({ page }) => {
    await page.goto('/blog');
    // Scoped to <main>. The pre-launch band above the header legitimately says
    // "Yakında … açılıyoruz" — the one place on the site where a coming-soon is
    // true and required (CLAUDE.md §10).
    const main = (await page.locator('main').textContent()) ?? '';
    expect(main).not.toMatch(/yükleniyor|yakında/i);
    expect(await page.locator('[aria-busy="true"]').count()).toBe(0);
  });

  test('all six categories are offered, plus Tümü', async ({ page }) => {
    await page.goto('/blog');
    const pills = page.locator('nav[aria-label="Yazı başlıkları"] a');
    await expect(pills).toHaveCount(CATEGORIES.length + 1);

    const hrefs = await pills.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    );
    for (const slug of CATEGORIES) {
      expect(hrefs).toContain(`/blog/kategori/${slug}`);
    }
  });

  test('the active filter is announced, not only coloured', async ({
    page,
  }) => {
    await page.goto('/blog');
    await expect(
      page.locator('nav[aria-label="Yazı başlıkları"] a[aria-current="page"]'),
    ).toHaveText('Tümü');

    await page.goto('/blog/kategori/epilasyon-rehberi');
    await expect(
      page.locator('nav[aria-label="Yazı başlıkları"] a[aria-current="page"]'),
    ).toHaveText('Epilasyon Rehberi');
  });

  test('pagination renders nothing while twelve fit on one page', async ({
    page,
  }) => {
    await page.goto('/blog');
    expect(await page.locator('nav[aria-label="Sayfalar"]').count()).toBe(0);
  });

  test('no byline appears anywhere', async ({ page }) => {
    await page.goto('/blog');
    const body = (await page.locator('body').textContent()) ?? '';
    for (const word of ['PENDING', 'Admin', 'Editör', 'Yazar']) {
      expect(body, word).not.toContain(word);
    }
  });

  test('heading levels do not skip', async ({ page }) => {
    await page.goto('/blog');
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) =>
        Number(el.tagName.slice(1)),
      ),
    );
    expect(levels[0]).toBe(1);
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/blog', '/blog/kategori/kas-kirpik-rehberi']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('category archives', () => {
  test('all six exist and none of them is empty', async ({ page }) => {
    for (const slug of CATEGORIES) {
      const response = await page.goto(`/blog/kategori/${slug}`);
      expect(response?.status(), slug).toBe(200);
      const cards = page.locator(POST_LINKS);
      expect(await cards.count(), slug).toBeGreaterThan(0);
    }
  });

  test('an archive lists only its own category', async ({ page }) => {
    await page.goto('/blog/kategori/epilasyon-rehberi');
    const hrefs = await page
      .locator(POST_LINKS)
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute('href') ?? ''),
      );
    expect(hrefs).toEqual(['/blog/lazer-epilasyon-nedir']);
  });

  test('an unknown category 404s', async ({ page }) => {
    const response = await page.goto('/blog/kategori/boyle-bir-kategori-yok');
    expect(response?.status()).toBe(404);
  });
});

test.describe('pagination routes', () => {
  test('/blog/sayfa/1 does not exist — it redirects to /blog', async ({
    page,
  }) => {
    const direct = await page.request.get('/blog/sayfa/1', { maxRedirects: 0 });
    expect([301, 308]).toContain(direct.status());
    expect(direct.headers()['location']).toBe('/blog');

    await page.goto('/blog/sayfa/1');
    await expect(page).toHaveURL(/\/blog$/);
  });

  test('a category page 1 redirects the same way', async ({ page }) => {
    const direct = await page.request.get(
      '/blog/kategori/cilt-ihtiyaclari/sayfa/1',
      { maxRedirects: 0 },
    );
    expect([301, 308]).toContain(direct.status());
    expect(direct.headers()['location']).toBe(
      '/blog/kategori/cilt-ihtiyaclari',
    );
  });

  test('page 2 does not exist while twelve posts fit on one page', async ({
    page,
  }) => {
    for (const path of [
      '/blog/sayfa/2',
      '/blog/sayfa/99',
      '/blog/kategori/cilt-ihtiyaclari/sayfa/2',
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
  });
});

test.describe('drafts and fixtures', () => {
  test('the M9 preview post is gone for good', async ({ page }) => {
    const response = await page.goto('/blog/sablon-onizleme');
    expect(response?.status()).toBe(404);
  });

  test('and no trace of it reaches any listing', async ({ page }) => {
    for (const path of ['/blog', '/blog/kategori/cilt-bakimi-rehberi']) {
      await page.goto(path);
      const html = await page.content();
      expect(html, path).not.toContain('sablon-onizleme');
      expect(html, path).not.toContain('Şablon Önizleme');
    }
  });
});

test.describe('posts', () => {
  test('all twelve routes respond', async ({ page }) => {
    for (const slug of POSTS) {
      const response = await page.goto(`/blog/${slug}`);
      expect(response?.status(), slug).toBe(200);
    }
  });

  test('a post renders every block of the §6 structure', async ({ page }) => {
    await page.goto('/blog/lazer-epilasyon-nedir');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Kısaca' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Sık sorulan sorular' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'İlgili hizmet', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'İlgili yazılar' }),
    ).toBeVisible();
  });

  test('every post carries the disclaimer and exactly one CTA', async ({
    page,
  }) => {
    for (const slug of POSTS) {
      await page.goto(`/blog/${slug}`);
      await expect(page.getByText(DISCLAIMER), slug).toBeVisible();
      // Scoped to <main>: the footer's nav link is not a call to action.
      await expect(page.locator('main a[href="/iletisim"]'), slug).toHaveCount(
        1,
      );
    }
  });

  test('no post shows a byline', async ({ page }) => {
    for (const slug of ['cilt-bakimi-nedir', 'gelin-bakim-takvimi']) {
      await page.goto(`/blog/${slug}`);
      const body = (await page.locator('body').textContent()) ?? '';
      for (const word of ['PENDING', 'Admin', 'Editör', 'Yazar']) {
        expect(body, `${slug} / ${word}`).not.toContain(word);
      }
    }
  });

  test('no post publishes a number it cannot stand behind', async ({
    page,
  }) => {
    for (const slug of POSTS) {
      await page.goto(`/blog/${slug}`);
      const main = (await page.locator('main').textContent()) ?? '';
      // The reading time is the one number on the page, and it is computed
      // from the body rather than authored.
      const withoutMeta = main.replace(/\d+ dk okuma/g, '');
      expect(withoutMeta, slug).not.toMatch(
        /\d+\s*(dakika|seans|hafta|ay|gün|kez)/i,
      );
      expect(withoutMeta, slug).not.toMatch(/%\s?\d/);
    }
  });

  test('a post links up to its hub and laterally to other posts', async ({
    page,
  }) => {
    await page.goto('/blog/microblading-nedir');
    await expect(
      page.locator('main a[href="/hizmetler/microblading"]').first(),
    ).toBeVisible();

    const lateral = await page
      .locator(`main ${POST_LINKS}`)
      .evaluateAll((links) => [
        ...new Set(links.map((link) => link.getAttribute('href') ?? '')),
      ]);
    expect(lateral.length).toBeGreaterThanOrEqual(2);
  });

  test('heading levels do not skip on a post', async ({ page }) => {
    await page.goto('/blog/kalici-makyaj-nedir');
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

  test('the service hub now shows its post', async ({ page }) => {
    await page.goto('/hizmetler/lazer-epilasyon');
    await expect(
      page.getByRole('heading', { name: 'İlgili yazılar' }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/blog/lazer-epilasyon-nedir"]'),
    ).toBeVisible();
  });

  test('no horizontal scroll on a post at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/blog/leke-gorunumu-nedenler-ve-bakim');
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
