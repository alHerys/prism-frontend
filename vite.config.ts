import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { pertaminaServer } from "./scripts/pertamina-server";
export default defineConfig(async ({ mode }) => {
  const pertamina = mode === "pertamina" || Boolean(process.env.PRISM_PERTAMINA_PACKAGE_URL);
  return {
    define: { "import.meta.env.VITE_PERTAMINA_ENABLED": JSON.stringify(String(pertamina)) },
    server: { proxy: pertamina ? undefined : { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api/, "") } } },
    plugins: [react(), ...(pertamina ? [await pertaminaServer()] : [])],
    test: { include: ["src/**/*.test.{ts,tsx}"], environment: "jsdom", setupFiles: ["./src/test-setup.ts"] },
  };
});
