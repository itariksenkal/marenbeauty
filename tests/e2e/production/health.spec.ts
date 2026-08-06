import { expect, test } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * Every shipped route must render without throwing.
 *
 * `next build` only catches errors raised during static generation. Anything
 * that throws after hydration passes the build and reaches a visitor, so it
 * needs a gate that actually loads the page.
 */
const ROUTES = ['/'];

test.describe('shipped routes render cleanly', () => {
  for (const route of ROUTES) {
    test(`${route} returns 200 and throws nothing`, async ({ page }) => {
      const errors = watchForRuntimeErrors(page);

      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBe(200);

      await page.waitForLoadState('networkidle');

      expect(errors.pageErrors, `${route} threw`).toEqual([]);
      expect(errors.consoleErrors, `${route} logged console errors`).toEqual(
        [],
      );
    });
  }

  for (const devOnly of ['/styleguide', '/motion']) {
    test(`${devOnly} is not reachable in production`, async ({ page }) => {
      // Dev-only review surfaces. If either ever returns 200 in a production
      // build, internal tooling is being served to visitors.
      const response = await page.goto(devOnly);
      expect(response?.status()).toBe(404);
    });
  }
});
