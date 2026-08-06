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
    },
    {
      command: 'npm run dev -- --port 3101',
      url: 'http://localhost:3101',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
