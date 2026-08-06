import { expect, test } from '@playwright/test';

/**
 * The pinned opening at reduced motion.
 *
 * The emulation is applied with `page.emulateMedia()` in a beforeEach, NOT via
 * `use: { reducedMotion }`. That option had no effect here at describe, file or
 * project level — probed directly, `matchMedia('(prefers-reduced-motion:
 * reduce)')` still reported false — so the tests ran against the full tier
 * while claiming to test reduced motion, which is worse than not testing it.
 * `emulateMedia` before navigation is unambiguous and verifiable.
 *
 * Reduced motion is a FIRST-CLASS COMPOSITION, not a fallback
 * (docs/MOTION.md §6), so these assert readability and layout, not merely that
 * nothing animates.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const STORY_LINES = [
  'Maren, denizle akraba bir isim.',
  'Sakin, ölçülü, acelesi olmayan bir yaklaşım.',
  'Yakında kapılarımızı açıyoruz.',
];

test.describe('pinned opening — reduced motion', () => {
  test('is a readable composition, not a fallback', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('html')).toHaveAttribute(
      'data-motion-tier',
      'reduced',
    );

    // Nothing is pinned: the sequence is normal flow.
    expect(await page.locator('[data-pinned-sequence]').count()).toBe(0);

    // Every line is visible and unclipped, and the header wordmark is present
    // because there is no handoff to wait for.
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-header-wordmark]')).toBeVisible();
    for (const line of STORY_LINES) {
      await expect(page.getByText(line, { exact: true })).toBeVisible();
    }

    const clipped = await page.evaluate((lines) => {
      return lines.filter((line) => {
        const span = [...document.querySelectorAll('span')].find(
          (el) => el.textContent?.trim() === line,
        );
        if (!span) return true;
        const clip = getComputedStyle(span).clipPath;
        return clip !== 'none' && !clip.includes('0%');
      });
    }, STORY_LINES);
    expect(clipped, 'lines still clipped at reduced motion').toEqual([]);
  });

  test('no page content is inert at reduced motion', async ({ page }) => {
    await page.goto('/');
    // Scoped to <main>: the header's closed mobile drawer and mega panel are
    // legitimately inert — that is what stops a keyboard user tabbing into a
    // menu they cannot see. The rule being checked is that no CONTENT is
    // withheld from a reduced-motion visitor.
    expect(await page.locator('main [inert]').count()).toBe(0);
  });
});
