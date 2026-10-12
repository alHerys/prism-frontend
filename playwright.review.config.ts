import { defineConfig } from "@playwright/test";
import desktop from "./playwright.config";

export default defineConfig({
  ...desktop,
  testMatch: "review-source.spec.ts",
  outputDir: "test-results/review-source",
  projects: [
    ...desktop.projects!,
    { name: "annotation-1368", use: { viewport: { width: 1368, height: 695 } } },
    { name: "phone-390", use: { viewport: { width: 390, height: 844 } } },
  ],
});
