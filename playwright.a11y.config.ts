import { defineConfig, devices } from '@playwright/test';

/**
 * The accessibility gate — `npm run test:a11y`.
 *
 * A SEPARATE CONFIG, on its own port, for one reason: it must be able to fail
 * on its own. Folded into `test:e2e` as a fourth project, an axe regression
 * would read as "the browser tests broke", and the first instinct on a red
 * browser suite is to look for a flaky selector. Accessibility is ranked above
 * visual polish and Lighthouse scores (`CLAUDE.md` §16); it gets its own gate.
 *
 * It drives the PRODUCTION build, because that is what visitors get — the dev
 * server ships extra attributes and a different stylesheet delivery, and an
 * audit of something nobody is served is not an audit.
 */
const A11Y_PORT = 3102;

export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${A11Y_PORT}`,
  },

  webServer: {
    command: `npm run start -- --port ${A11Y_PORT}`,
    url: `http://127.0.0.1:${A11Y_PORT}`,
    // Never reuse: a stale server serves the previous build, and an audit of
    // the previous build is worse than no audit (docs/OPEN-QUESTIONS.md G13).
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // The contact page cannot render its form token without one, and a page
      // that 500s is not a page axe can audit. Not a credential — see
      // playwright.config.ts.
      ALTCHA_HMAC_KEY: 'playwright-fixed-altcha-key-0000000000000000',
    },
  },
});
