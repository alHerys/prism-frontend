import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'desktop.spec.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/playwright',
  snapshotPathTemplate: '{testDir}/../test-results/snapshots/{projectName}/{arg}{ext}',
  expect: { timeout: 10_000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.001 } },
  use: {
    baseURL: process.env.PRISM_PREVIEW_URL || 'http://127.0.0.1:5175',
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.PRISM_BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-1366', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'desktop-1920', use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
