import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';
export default defineConfig({ ...desktop, testMatch: 'tables-feedback.spec.ts', timeout: 120000, outputDir: 'test-results/tables-feedback', projects: [390,1520].map(width => ({ name: `tables-${width}`, use: { viewport: { width, height: 842 } } })) });
