import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';

export default defineConfig({
  ...desktop,
  testMatch: 'responsive.spec.ts',
  timeout: 120_000,
  outputDir: 'test-results/responsive',
  projects: [375, 390, 639, 640, 768, 1023, 1024, 1366, 1920].map(width => ({
    name: `width-${width}`,
    use: { viewport: { width, height: width < 1024 ? 844 : 1080 } },
  })),
});
