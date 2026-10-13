import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  server: { proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, rewrite: path => path.replace(/^\/api/, "") } } },
  plugins: [react()],
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "jsdom", setupFiles: ["./src/test-setup.ts"] },
});
