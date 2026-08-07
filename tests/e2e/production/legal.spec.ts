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

    /**
     * The entity comes from the environment and from nowhere else.
     *
     * Production sets `LEGAL_ENTITY` (a **provisional** value — the company is
     * still being registered, `docs/OPEN-QUESTIONS.md` B2). CI does not, and
     * cannot meaningfully: these pages are statically prerendered, so the ünvan
     * is read at BUILD time. This asserts the half CI can see — that a build
     * without one names nothing rather than guessing. `legalEntity()` has unit
     * tests for the resolved half, and `npm run preflight` refuses a deploy
     * without it.
     */
    test(`${page_.path} names no entity in a build without one`, async ({
      page,
    }) => {
      await page.goto(page_.path);
      const text = (await page.locator('body').innerText()).toLowerCase();

      // Never an invented ünvan …
      expect(text).not.toMatch(/ltd\.?\s*şti|limited şirketi|anonim şirketi/);
      // … and never the token, which guard rule 2 blocks from output anyway.
      expect(text).not.toContain('{{');
      // … just the honest sentence for an environment that has none.
      expect(text).toContain('ticari ünvanı');
    });

    /**
     * The owner approved publication on 2026-08-07, so the draft notice is
     * gone and a real effective date is shown. `docs/OPEN-QUESTIONS.md` C8
     * stays open: no external lawyer has read these texts, and that is tracked
     * by `legal.hasExternalLegalReview`, not by anything on the page.
     */
    test(`${page_.path} is published, with a dated notice`, async ({
      page,
    }) => {
      await page.goto(page_.path);

      await expect(page.getByText('Taslak metin')).toHaveCount(0);
      await expect(
        page.getByText('Yürürlük tarihi, hukuki inceleme sonrasında'),
      ).toHaveCount(0);

      // A real, formatted date rather than a promise of one.
      await expect(
        page.getByText(/Yürürlük tarihi:\s*\d{1,2}\s+\p{L}+\s+\d{4}/u),
      ).toBeVisible();
    });
  }

  test('every legal page is reachable from the footer of any page', async ({
    page,
  }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    for (const page_ of PAGES) {
      // The mega footer links each notice twice — in the legal column and in
      // the baseline row. What matters is that it is reachable, not the count.
      expect(
        await footer.locator(`a[href="${page_.path}"]`).count(),
      ).toBeGreaterThan(0);
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
