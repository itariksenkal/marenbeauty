import { expect, test } from '@playwright/test';

/**
 * The skip link is the first thing a keyboard user meets on every page, and it
 * is the one control that is *supposed* to be invisible until it matters. Two
 * ways it goes wrong, and both need a real layout engine to catch:
 *
 *   1. It renders visibly at rest — an odd stray link above the header.
 *   2. It occupies layout space while hidden, pushing the page down by a line.
 *
 * jsdom cannot answer either question; it has no layout. Hence a browser test.
 */
test.describe('skip link', () => {
  test('is out of the viewport at rest and takes no layout space', async ({
    page,
  }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'İçeriğe geç' });
    await expect(skipLink).toBeAttached();

    // It must remain in the accessibility tree — hiding it with `display: none`
    // or `visibility: hidden` would remove it from the tab order entirely,
    // which defeats the point.
    const box = await skipLink.boundingBox();
    expect(
      box,
      'skip link should still be laid out (not display:none)',
    ).not.toBeNull();

    // Wholly outside the viewport — fully above the top edge or fully left of
    // the left edge. No "it's only 1px" escape hatch: the requirement is that
    // it is out of the viewport, not merely small.
    expect(
      box!.y + box!.height <= 0 || box!.x + box!.width <= 0,
      `skip link is inside the viewport at rest: ${JSON.stringify(box)}`,
    ).toBe(true);

    // It must not occupy flow space. Absolutely/fixed positioned elements do
    // not, so assert the header sits at the very top of the document.
    const headerTop = await page
      .locator('header')
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(
      headerTop,
      'header should start at the top — the skip link must not push it down',
    ).toBeLessThanOrEqual(1);
  });

  test('becomes visible inside the viewport when focused, and is first in the tab order', async ({
    page,
  }) => {
    await page.goto('/');

    // First Tab from the document must land on the skip link.
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('href', '#main');

    const skipLink = page.getByRole('link', { name: 'İçeriğe geç' });
    await expect(skipLink).toBeVisible();

    const box = await skipLink.boundingBox();
    expect(box).not.toBeNull();

    const viewport = page.viewportSize()!;

    // Fully inside the viewport.
    expect(
      box!.x,
      'focused skip link is off the left edge',
    ).toBeGreaterThanOrEqual(0);
    expect(
      box!.y,
      'focused skip link is above the top edge',
    ).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);

    // And actually perceivable, not a clipped 1px box.
    expect(box!.width, 'focused skip link is still clipped').toBeGreaterThan(
      40,
    );
    expect(box!.height, 'focused skip link is still clipped').toBeGreaterThan(
      20,
    );
  });

  test('stays out of the viewport even with the stylesheet blocked', async ({
    page,
  }) => {
    // The real failure this guards. In dev the stylesheet is injected by JS, so
    // for the first few hundred ms no utility class applies and the link
    // rendered in normal flow above the header. Anything that hides it *only*
    // once the stylesheet lands is the wrong guarantee — and would fail
    // outright if the stylesheet 404'd.
    await page.route('**/*.css', (route) => route.abort());
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'İçeriğe geç' });
    const box = await skipLink.boundingBox();
    expect(box).not.toBeNull();

    expect(
      box!.y + box!.height <= 0 || box!.x + box!.width <= 0,
      `skip link is inside the viewport without the stylesheet: ${JSON.stringify(box)} — ` +
        `its hidden state must not depend on the stylesheet loading`,
    ).toBe(true);

    // And it must still be reachable, not hidden from the tab order.
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '#main');
  });

  test('moves focus to main content when activated', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator('#main')).toBeFocused();
  });
});
