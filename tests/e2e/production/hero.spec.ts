import { expect, test, type Page } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The pinned opening — the first thing anyone sees, so it gets the most
 * verification of anything on the site.
 *
 * Run against the production build, because that is what a visitor gets.
 * The `?motion=` override is development-only, so tier behaviour here is
 * driven by Playwright's `reducedMotion` emulation instead — which is also
 * what a real visitor's OS setting does.
 */

const STORY_LINES = [
  'Maren, denizle akraba bir isim.',
  'Sakin, ölçülü, acelesi olmayan bir yaklaşım.',
  'Yakında kapılarımızı açıyoruz.',
];

/**
 * Scroll to a fraction of the pinned sequence and let motion values settle.
 *
 * `behavior: 'instant'` matters: the site sets `scroll-behavior: smooth`, so a
 * plain `scrollTo` animates and successive calls interrupt each other — the
 * page never arrives where the test thinks it is.
 */
async function scrollToProgress(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const pinned = document.querySelector('[data-pinned-sequence]');
    if (!pinned) throw new Error('no pinned sequence on the page');
    const rect = pinned.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const distance = rect.height - window.innerHeight;
    window.scrollTo({ top: top + distance * f, behavior: 'instant' });
  }, fraction);
  await page.waitForTimeout(300);
}

const handoffState = (page: Page) =>
  page.locator('html').getAttribute('data-hero-handoff');

/**
 * Wait for the handoff to reach a state, rather than sampling it.
 *
 * The attribute is written from a scroll-linked motion value, so it lands on
 * the next animation frame after a scroll — not synchronously with it. A fixed
 * `waitForTimeout` after scrolling is usually enough and is not always enough:
 * under a loaded machine this test failed once with "pending" on a page that
 * was a frame away from "done". Waiting for the condition removes the race
 * without weakening what is asserted.
 */
async function expectHandoff(page: Page, state: 'pending' | 'done') {
  await page.waitForFunction(
    (want) => document.documentElement.dataset.heroHandoff === want,
    state,
  );
  expect(await handoffState(page)).toBe(state);
}

test.describe('pinned opening', () => {
  test('renders with no runtime error and exactly one h1', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Maren');
  });

  test('pins for 300svh on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const { height, viewport } = await page.evaluate(() => {
      const pinned = document.querySelector('[data-pinned-sequence]');
      return {
        height: pinned?.getBoundingClientRect().height ?? 0,
        viewport: window.innerHeight,
      };
    });
    // 300svh, within a small tolerance for how svh resolves in a headless
    // browser with no dynamic chrome.
    expect(height / viewport).toBeGreaterThan(2.8);
    expect(height / viewport).toBeLessThan(3.2);
  });

  test('pins for 180svh below 768px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/');

    const { height, viewport } = await page.evaluate(() => {
      const pinned = document.querySelector('[data-pinned-sequence]');
      return {
        height: pinned?.getBoundingClientRect().height ?? 0,
        viewport: window.innerHeight,
      };
    });
    expect(height / viewport).toBeGreaterThan(1.65);
    expect(height / viewport).toBeLessThan(1.95);
  });

  test('the stage is exactly one viewport tall, sized in svh', async ({
    page,
  }) => {
    // svh rather than vh is what stops the stage jumping when mobile browser
    // chrome collapses. A headless browser has no dynamic chrome, so this
    // asserts the sizing is viewport-exact; the no-jump behaviour itself is a
    // manual check on a real device.
    await page.goto('/');
    const { stageHeight, viewport } = await page.evaluate(() => {
      const stage = document.querySelector('[data-pinned-sequence] > div');
      return {
        stageHeight: stage?.getBoundingClientRect().height ?? 0,
        viewport: window.innerHeight,
      };
    });
    expect(Math.abs(stageHeight - viewport)).toBeLessThan(2);
  });

  test('story text is in the DOM from first paint, before it reveals', async ({
    page,
  }) => {
    // Reveals are clip-path only, never display/visibility, so find-in-page
    // locates the copy before the reader reaches it.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').textContent();
    for (const line of STORY_LINES) {
      expect(body, line).toContain(line);
    }
  });

  test('the wordmark hands off as a cross-fade between two elements', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Stage 1: hero wordmark visible, header wordmark withheld.
    await scrollToProgress(page, 0);
    expect(await handoffState(page)).toBe('pending');
    await expect(page.locator('[data-header-wordmark]')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();

    // After the handoff range: header wordmark present.
    await scrollToProgress(page, 0.6);
    expect(await handoffState(page)).toBe('done');
    await expect(page.locator('[data-header-wordmark]')).toBeVisible();

    // Two separate elements — the hero wordmark never moved into the header.
    const heroInHeader = await page
      .locator('header h1')
      .count()
      .catch(() => 0);
    expect(
      heroInHeader,
      'the hero wordmark must not end up inside the header',
    ).toBe(0);
  });

  test('the handoff is correct after a mid-sequence refresh', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await scrollToProgress(page, 0.75);
    await expectHandoff(page, 'done');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // The browser restores the scroll position; the hero must seed from where
    // it actually is, not from zero.
    await page.waitForFunction(() => window.scrollY > 100);
    const scrolled = await page.evaluate(() => window.scrollY);
    expect(scrolled, 'scroll position was not restored').toBeGreaterThan(100);
    await expectHandoff(page, 'done');
    await expect(page.locator('[data-header-wordmark]')).toBeVisible();
  });

  test('stages not yet reached are inert', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await scrollToProgress(page, 0);
    const storyBefore = page.locator('[data-pinned-sequence] [inert]');
    expect(await storyBefore.count()).toBeGreaterThan(0);

    await scrollToProgress(page, 0.99);
    expect(
      await page.locator('[data-pinned-sequence] [inert]').count(),
      'nothing should still be inert at the end of the sequence',
    ).toBe(0);
  });

  test('keyboard traversal reaches the header, not the pinned content', async ({
    page,
  }) => {
    await page.goto('/');
    await scrollToProgress(page, 0);

    await page.keyboard.press('Tab'); // skip link
    await expect(page.locator(':focus')).toHaveAttribute('href', '#main');

    // The header wordmark is withheld during stage 1, so the next stop must not
    // be an invisible link.
    await page.keyboard.press('Tab');
    const focusedIsHidden = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return false;
      return getComputedStyle(el).visibility === 'hidden';
    });
    expect(focusedIsHidden, 'focus landed on a hidden element').toBe(false);
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');

    for (const fraction of [0, 0.3, 0.6, 1]) {
      await scrollToProgress(page, fraction);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(
        overflow,
        `horizontal overflow at progress ${fraction}`,
      ).toBeLessThanOrEqual(0);
    }
  });
});
