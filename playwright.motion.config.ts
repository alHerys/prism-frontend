import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';

export default defineConfig({
  ...desktop,
  testMatch: 'motion.spec.ts',
  outputDir: 'test-results/motion',
  use: { ...desktop.use, reducedMotion: 'no-preference' },
  projects: [
    { name: 'motion-desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'motion-phone', use: { viewport: { width: 390, height: 844 } } },
  ],
});
