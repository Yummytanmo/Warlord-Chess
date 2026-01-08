import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false, // Sequential for multi-client tests to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Limit concurrency for multiplayer tests
  reporter: [
    ['html'],
    ['list'], // Show progress during test run
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Multiplayer testing needs longer timeout for synchronization
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  // Global timeout for entire test
  timeout: 60000, // 1 minute per test for multi-client scenarios
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable viewport for room testing
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Disable webkit for initial MVP - Socket.IO works best on Chromium/Firefox
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server with Socket.IO
    stdout: 'pipe',
    stderr: 'pipe',
  },
});