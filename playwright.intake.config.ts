import { defineConfig } from "@playwright/test";
import desktop from "./playwright.config";
export default defineConfig({ ...desktop, testMatch: "a5-intake.spec.ts", outputDir: "test-results/a5-intake", projects: [
  { name: "intake-desktop", use: { viewport: { width: 1376, height: 695 } } },
  { name: "intake-phone", use: { viewport: { width: 390, height: 844 } } },
] });
