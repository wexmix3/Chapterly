import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // testDir is overridden per-project below
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'https://www.getchapterly.com',
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    // ── Browser E2E (UX + authenticated flows) ────────────────────────────
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── API contract tests (no browser — pure HTTP via request fixture) ───
    // Tests that every protected route enforces 401, and that public
    // endpoints behave correctly.  Runs against the live production URL.
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://www.getchapterly.com',
      },
    },
  ],
});
