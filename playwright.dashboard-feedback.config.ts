import { defineConfig } from '@playwright/test';
import desktop from './playwright.config';
export default defineConfig({ ...desktop, testMatch: 'dashboard-feedback.spec.ts', outputDir: 'test-results/dashboard-feedback', projects: [{ name: 'dashboard-feedback', use: { viewport: { width: 1256, height: 842 } } }] });
