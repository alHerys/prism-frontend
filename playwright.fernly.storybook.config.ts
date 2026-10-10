import { defineConfig } from '@playwright/test';
import storybook from './playwright.storybook.config';

process.env.PRISM_VISUAL_CAPTURE = '1';

export default defineConfig({
  ...storybook,
  outputDir: 'test-results/fernly-storybook',
  snapshotPathTemplate: '{testDir}/../test-results/fernly-snapshots/{projectName}/{arg}{ext}',
});
