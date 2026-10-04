import { architecture } from "./eslint.architecture.js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default tseslint.config(
  { ignores: ["dist", "node_modules", "scripts", "storybook-static", "test-results", "playwright-report"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks, prism: { rules: { architecture } } },
    rules: {
      ...hooks.configs.recommended.rules,
      "prism/architecture": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
