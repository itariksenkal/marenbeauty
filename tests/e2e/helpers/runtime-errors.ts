import type { ConsoleMessage, Page } from '@playwright/test';

/**
 * Collects anything that indicates the page blew up.
 *
 * Exists because `next build` only catches errors thrown during static
 * generation. A page that throws after hydration — or a dev-only route that
 * never gets built at all — was invisible to every gate.
 */
export type RuntimeErrors = {
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
};

/**
 * Noise the dev server emits that says nothing about our code.
 * Deliberately narrow: a broad filter would swallow the failures this exists
 * to catch.
 */
const IGNORED = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Turbopack/i,
  /favicon\.ico/i,
];

export function watchForRuntimeErrors(page: Page): RuntimeErrors {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (IGNORED.some((pattern) => pattern.test(text))) return;
    consoleErrors.push(text);
  });

  return { pageErrors, consoleErrors };
}

/** Next renders a dev error overlay rather than throwing to the console. */
export async function hasDevErrorOverlay(page: Page): Promise<boolean> {
  return page
    .locator(
      'nextjs-portal, [data-nextjs-dialog], #nextjs__container_errors_label',
    )
    .first()
    .isVisible()
    .catch(() => false);
}
