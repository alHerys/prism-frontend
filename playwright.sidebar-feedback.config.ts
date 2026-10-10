import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';
export default defineConfig({
  ...desktop,
  testMatch: 'sidebar-feedback.spec.ts',
  outputDir: 'test-results/sidebar-feedback',
  projects: [{ name: 'sidebar-feedback', use: { viewport: { width: 1538, height: 790 } } }],
});
