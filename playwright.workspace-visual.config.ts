import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';
process.env.PRISM_VISUAL_CAPTURE = '1';
export default defineConfig({
  ...desktop,
  outputDir: 'test-results/workspace-visual',
  snapshotPathTemplate: '{testDir}/../test-results/workspace-snapshots/{projectName}/{arg}{ext}',
});
