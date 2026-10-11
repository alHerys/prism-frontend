import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';
export default defineConfig({ ...desktop, testMatch: 'review-feedback.spec.ts', outputDir: 'test-results/review-feedback', projects: [{ name: 'review-feedback', use: { viewport: { width: 1521, height: 842 } } }] });
