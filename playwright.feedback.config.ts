import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';

export default defineConfig({
  ...desktop,
  testMatch: 'feedback.spec.ts',
  outputDir: 'test-results/feedback',
  projects: [390, 1023, 1024, 1520].map(width => ({
    name: `feedback-${width}`,
    use: { viewport: { width, height: width === 1520 ? 793 : 844 } },
  })),
});
