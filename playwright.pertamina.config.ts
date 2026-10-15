import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({ ...base, testMatch: "pertamina-local.spec.ts", outputDir: "test-results/pertamina-local",
  use: { ...base.use, baseURL: process.env.PRISM_PREVIEW_URL || "http://127.0.0.1:5178" },
  projects: [
    { name: "pertamina-desktop", use: { viewport: { width: 1368, height: 800 } } },
    { name: "pertamina-phone", use: { viewport: { width: 390, height: 844 } } },
  ],
});
