import { expect, test } from '@playwright/test';

/**
 * The three legal notices, driven in a browser.
 *
 * The unit tests prove the text is right. These prove it is *reachable* and
 * *published*: a notice nobody can get to from the site is not published, and
 * the whole point of M12 is that the pages exist as a visitor's route rather
 * than as three files in the repo.
 */
const PAGES = [
  { path: '/kvkk', heading: 'KVKK Aydınlatma Metni' },
  { path: '/cerez-politikasi', heading: 'Çerez Politikası' },
  { path: '/kullanim-kosullari', heading: 'Kullanım Koşulları' },
];

test.describe('legal pages', () => {
  for (const page_ of PAGES) {
    test(`${page_.path} renders with exactly one h1`, async ({ page }) => {
      const response = await page.goto(page_.path);
      expect(response?.status()).toBe(200);

      const h1 = page.locator('main h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(page_.heading);
    });

    test(`${page_.path} names no legal entity while B2 is open`, async ({
      page,
    }) => {
      await page.goto(page_.path);
      const text = (await page.locator('body').innerText()).toLowerCase();

      // Neither an invented ünvan …
      expect(text).not.toMatch(/ltd\.?\s*şti|limited şirketi|anonim şirketi/);
      // … nor the token, which the guard blocks from output by design.
      expect(text).not.toContain('{{');
      // … and the reader is told plainly that it is pending.
      expect(text).toContain('ticari ünvanı');
    });

    test(`${page_.path} is marked as an unreviewed draft`, async ({ page }) => {
      await page.goto(page_.path);
      await expect(page.getByText('Taslak metin')).toBeVisible();
      await expect(
        page.getByText('Yürürlük tarihi, hukuki inceleme sonrasında'),
      ).toBeVisible();
    });
  }

  test('every legal page is reachable from the footer of any page', async ({
    page,
  }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    for (const page_ of PAGES) {
      await expect(footer.locator(`a[href="${page_.path}"]`)).toHaveCount(1);
    }
  });

  test('the consent checkbox links to /kvkk', async ({ page }) => {
    await page.goto('/iletisim');
    const consentLink = page.locator('form a[href="/kvkk"]');
    await expect(consentLink).toHaveCount(1);
  });

  test('/lisanslar renders the generated NOTICE and is noindex', async ({
    page,
  }) => {
    const response = await page.goto('/lisanslar');
    expect(response?.status()).toBe(200);

    await expect(page.locator('main h1')).toHaveText('Lisanslar ve atıflar');
    // Attribution the CC-BY packages are actually owed, on a public surface.
    await expect(page.locator('pre')).toContainText('caniuse-lite');
    await expect(page.locator('pre')).toContainText('CC-BY-4.0');

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  test('/lisanslar does not scroll the page body horizontally at 320px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/lisanslar');

    // The NOTICE is column-aligned plain text, so it must scroll inside its
    // own box rather than widening the document.
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
