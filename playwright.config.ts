import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests. These exist for assertions that only a real layout engine can
 * make — "is this element inside the viewport?" cannot be answered by jsdom,
 * which has no layout at all.
 *
 * Runs against the production build, not `next dev`: the dev overlay injects
 * its own fixed-position elements, and we want to test what ships.
 *
 * M15 adds axe accessibility assertions on top of this same harness.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run start -- --port 3100',
    url: 'http://127.0.0.1:3100',
    // Never reuse. A left-over server from a previous run keeps serving the
    // PREVIOUS build, so a regression can pass against stale output — which is
    // exactly the false confidence a test suite must not give. Costs a few
    // seconds per run; worth it.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
