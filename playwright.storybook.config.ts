import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';

export default defineConfig({
  ...desktop,
  testMatch: 'storybook.spec.ts',
  outputDir: '.impeccable/review/storybook-results',
  use: { ...desktop.use, baseURL: process.env.PRISM_STORYBOOK_URL || 'http://127.0.0.1:6006' },
});
