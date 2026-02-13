import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [['html', { open: 'never' }], ['json', { outputFile: 'test-results/e2e-tests.json' }]]
    : [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173/avail',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/avail',
    reuseExistingServer: !process.env.CI,
  },
});
