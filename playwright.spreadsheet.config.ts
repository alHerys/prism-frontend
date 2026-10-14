import { defineConfig } from "@playwright/test";
import desktop from "./playwright.config";
export default defineConfig({
  ...desktop,
  testMatch: ["offer-spreadsheet-review.spec.ts", "owner-estimate-review.spec.ts"],
  outputDir: "test-results/spreadsheet-review",
  projects: [
    { name: "desktop-1520", use: { viewport: { width: 1520, height: 842 } } },
    { name: "phone-390", use: { viewport: { width: 390, height: 844 } } },
  ],
});
