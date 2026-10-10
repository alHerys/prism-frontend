import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';

export default defineConfig({
  ...desktop,
  testMatch: 'workspace-preferences.spec.ts',
  outputDir: 'test-results/preferences-review',
  timeout: 45_000,
  snapshotPathTemplate: '{testDir}/../test-results/preferences-snapshots/{projectName}/{arg}{ext}',
  // Static captures are review artifacts. Motion is exercised independently.
  expect: { timeout: 10_000 },
  use: { ...desktop.use, reducedMotion: 'no-preference', actionTimeout: 10_000 },
  projects: [
    { name: 'preferences-desktop', use: { viewport: { width: 1520, height: 793 } } },
    { name: 'preferences-phone', use: { viewport: { width: 390, height: 844 } } },
  ],
});
