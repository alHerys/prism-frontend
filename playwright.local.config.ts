import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'local-regression.spec.ts',
  timeout: 120_000,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/local',
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PRISM_PREVIEW_URL || 'http://127.0.0.1:5175',
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.PRISM_BROWSER_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined) },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'local-1366', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'local-1920', use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
