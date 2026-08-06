import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests, in two projects.
 *
 * `production` drives the real build — what visitors get.
 *
 * `development` exists because dev-only routes (/styleguide, and the motion
 * demo) 404 in production, so the production build never exercises them and no
 * other gate can see them. A broken review surface would otherwise sit broken
 * while `npm run verify` stayed green. Dev also catches failures that only
 * appear before the stylesheet lands, which is how the skip-link bug hid.
 */
/**
 * Fixed signing key for both test servers.
 *
 * Not a secret and not the owner's to supply: the HMAC key protects challenge
 * integrity, and a deployment generates its own. Fixing it here makes runs
 * reproducible and lets a test mint a valid token out of band.
 */
const TEST_HMAC_KEY = 'playwright-fixed-altcha-key-0000000000000000';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: { trace: 'on-first-retry' },

  projects: [
    {
      name: 'production',
      testDir: './tests/e2e/production',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3100' },
    },
    {
      // Reduced motion, against the production build. The emulation itself is
      // applied per-test with page.emulateMedia(): the `reducedMotion` use-option
      // had no effect at describe, file OR project level here — probed directly,
      // matchMedia still reported false — so relying on it would have meant
      // these tests silently running against the full tier.
      name: 'production-reduced',
      testDir: './tests/e2e/production-reduced',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3100' },
    },
    {
      name: 'development',
      testDir: './tests/e2e/development',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3101' },
    },
  ],

  // Never reuse. A left-over server keeps serving a PREVIOUS build — or, worse,
  // a module graph it compiled while a file was momentarily broken, which then
  // survives the fix. That has already cost this project a debugging session.
  webServer: [
    {
      command: 'npm run start -- --port 3100',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        // A signing key is OURS to generate, not the owner's to supply, so the
        // test servers get a fixed one. It is not a credential and is not a
        // secret — a real deployment generates its own (docs/DEPLOY.md).
        ALTCHA_HMAC_KEY: TEST_HMAC_KEY,
        // Deliberately NO SMTP variables here. The production project asserts
        // that a submission with nowhere to go fails cleanly and says nothing
        // specific — which is exactly the state the site is in until the
        // credential lands (docs/OPEN-QUESTIONS.md B1/B3).
      },
    },
    {
      command: 'npm run dev -- --port 3101',
      url: 'http://localhost:3101',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ALTCHA_HMAC_KEY: TEST_HMAC_KEY,
        // The local capture stands in for a mailbox. `env.ts` refuses this in
        // production, so it can only ever be the development story.
        MAIL_TRANSPORT: 'capture',
      },
    },
  ],
});
