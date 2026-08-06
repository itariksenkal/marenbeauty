import { expect, test } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The blog system in production, with nothing published.
 *
 * This is the state the site actually ships in today, so it is the state worth
 * asserting hardest: the listing explains itself, all six archives exist, the
 * draft preview is nowhere, and no page-number URL resolves to an empty grid.
 */

const CATEGORIES = [
  'cilt-bakimi-rehberi',
  'cilt-yenileme-rehberi',
  'epilasyon-rehberi',
  'cilt-ihtiyaclari',
  'kas-kirpik-rehberi',
  'ozel-gun-ve-mevsim',
];

const EMPTY_ALL =
  'Burada henüz yayımlanmış bir yazı yok. İlk yazılar yayımlandığında bu sayfada listelenecek.';
const EMPTY_CATEGORY = 'Bu başlıkta henüz yayımlanmış bir yazı yok.';

test.describe('blog index', () => {
  test('renders with no runtime error and exactly one h1', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('the empty state is a real sentence, with a way onward', async ({
    page,
  }) => {
    await page.goto('/blog');
    await expect(page.getByText(EMPTY_ALL)).toBeVisible();
    // Not a dead end: the pages that DO exist are one click away.
    await expect(
      page.getByRole('link', { name: 'Hizmetlere göz atın' }),
    ).toHaveAttribute('href', '/hizmetler');
  });

  test('shows no skeleton, spinner or "yakında"', async ({ page }) => {
    await page.goto('/blog');
    // Scoped to <main>. The pre-launch band above the header legitimately says
    // "Yakında … açılıyoruz" — that is the one place on the site where a
    // "coming soon" is true and required (CLAUDE.md §10). The blog's own empty
    // state may not borrow it.
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

  test('pagination renders nothing while there is one page', async ({
    page,
  }) => {
    // No greyed-out arrows, no lonely "1".
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
  test('all six exist and carry their own empty state', async ({ page }) => {
    for (const slug of CATEGORIES) {
      const response = await page.goto(`/blog/kategori/${slug}`);
      expect(response?.status(), slug).toBe(200);
      await expect(page.getByText(EMPTY_CATEGORY), slug).toBeVisible();
    }
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
    const direct = await page.request.get('/blog/sayfa/1', {
      maxRedirects: 0,
    });
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

  test('page 2 does not exist while there is one page of results', async ({
    page,
  }) => {
    // A 404 rather than an empty grid: the page genuinely is not there.
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

test.describe('drafts', () => {
  test('the preview post has no route in production', async ({ page }) => {
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
