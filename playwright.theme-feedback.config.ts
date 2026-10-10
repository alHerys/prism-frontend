import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';
export default defineConfig({
  ...desktop,
  testMatch: 'theme-feedback.spec.ts',
  timeout: 180_000,
  outputDir: 'test-results/theme-feedback',
  projects: [
    { name: 'theme-desktop', use: { viewport: { width: 1538, height: 790 } } },
    { name: 'theme-phone', use: { viewport: { width: 390, height: 844 } } },
  ],
});
