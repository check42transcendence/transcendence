import { defineConfig } from '@playwright/test'

// Configures browser tests.
export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    baseURL: 'https://transcendence-e2e-frontend-1',
    ignoreHTTPSErrors: true,
  },
})
