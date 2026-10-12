import { defineConfig } from "@playwright/test";
import desktop from "./playwright.config";

export default defineConfig({
  ...desktop,
  testMatch: "procurement-documents.spec.ts",
  outputDir: "test-results/procurement-documents",
  projects: [
    ...desktop.projects!,
    { name: "annotation-1520", use: { viewport: { width: 1520, height: 842 } } },
    { name: "annotation-705", use: { viewport: { width: 705, height: 842 } } },
    { name: "phone-390", use: { viewport: { width: 390, height: 844 } } },
  ],
});
