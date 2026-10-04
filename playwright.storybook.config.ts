import { defineConfig } from '@playwright/test';
import desktop from './playwright.config.ts';

export default defineConfig({
  ...desktop,
  testMatch: 'storybook.spec.ts',
  outputDir: 'test-results/storybook',
  use: { ...desktop.use, baseURL: process.env.PRISM_STORYBOOK_URL || 'http://127.0.0.1:6006' },
});
