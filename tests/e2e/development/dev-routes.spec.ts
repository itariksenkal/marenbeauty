import { expect, test } from '@playwright/test';

import {
  hasDevErrorOverlay,
  watchForRuntimeErrors,
} from '../helpers/runtime-errors';

/**
 * Dev-only routes.
 *
 * These 404 in production by design, so the production build never exercises
 * them and no other gate can see them. Without this suite a broken
 * /styleguide — the surface the design system is reviewed on — would sit
 * broken while `npm run verify` stayed green. That is precisely the failure
 * mode this project has already hit once.
 */
const DEV_ROUTES = ['/', '/styleguide', '/motion'];

test.describe('dev-only routes render cleanly', () => {
  for (const route of DEV_ROUTES) {
    test(`${route} loads with no runtime error`, async ({ page }) => {
      const errors = watchForRuntimeErrors(page);

      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBe(200);
      await page.waitForLoadState('networkidle');

      expect(
        await hasDevErrorOverlay(page),
        `${route} rendered the Next.js error overlay`,
      ).toBe(false);
      expect(errors.pageErrors, `${route} threw`).toEqual([]);
      expect(errors.consoleErrors, `${route} logged console errors`).toEqual(
        [],
      );
    });
  }

  test('/styleguide renders the design system, not an empty shell', async ({
    page,
  }) => {
    await page.goto('/styleguide');
    // A content check, so a route that returns 200 while rendering nothing
    // still fails.
    await expect(
      page.getByRole('heading', { name: 'Design system' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Turkish glyphs/ }),
    ).toBeVisible();
  });
});
