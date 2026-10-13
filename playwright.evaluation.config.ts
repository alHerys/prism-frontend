import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({ ...base, testMatch: "evaluation-layout.spec.ts", outputDir: "test-results/evaluation-layout", projects: [
  { name: "evaluation-desktop", use: { viewport: { width: 1368, height: 758 } } },
  { name: "evaluation-phone", use: { viewport: { width: 390, height: 844 } } },
] });
