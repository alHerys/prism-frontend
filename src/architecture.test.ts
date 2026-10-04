// @vitest-environment node
import { expect, it } from "vitest";
import { Linter } from "eslint";
import parser from "@typescript-eslint/parser";
// @ts-expect-error The repository's ESLint plugin is a JavaScript tooling module.
import { architecture } from "../eslint.architecture.js";
const root = new URL("..", import.meta.url).pathname;
const linter = new Linter();
function inspect(file: string, code: string) {
  return linter.verify(code, [{ files: ["**/*.ts"], languageOptions: { parser }, plugins: { prism: { rules: { architecture } } }, rules: { "prism/architecture": "error" } }], { filename: root + file });
}
it.each([
  ["src/modules/documents/domain/bad.ts", 'import { useState } from "react";'],
  ["src/modules/documents/application/bad.ts", 'export { createLocalRuntime } from "../../../infrastructure/local/runtime";'],
  ["src/modules/documents/presentation/bad.ts", 'import("@/infrastructure/local/runtime");'],
  ["src/shared/ui/bad.ts", 'import type { DocumentRecord } from "../../modules/documents/domain/models";'],
  ["src/modules/documents/presentation/bad.ts", 'import { BankPage } from "../../historical-prices/presentation/BankPage";'],
  ["src/pages/dashboard/bad.ts", 'import { useBankPage } from "../../modules/historical-prices/presentation/useBankPage";'],
  ["src/modules/documents/domain/bad.ts", 'export const read = () => window.location.href;'],
  ["src/modules/documents/application/bad.ts", 'type Data = import("../../../infrastructure/local/state").LocalState;'],
  ["src/modules/documents/domain/bad.ts", 'export { value } from "./bad";'],
])("rejects a forbidden dependency in %s", (file, code) => {
  expect(inspect(file, code).some((message) => message.ruleId === "prism/architecture")).toBe(true);
});
it.each([
  ["src/modules/documents/application/valid.ts", 'import type { DocumentRecord } from "../domain/models";'],
  ["src/modules/documents/domain/valid.ts", 'export const id = (document: { id: string }) => document.id;'],
  ["src/pages/procurement/valid.ts", 'import { HEAPanel } from "../../modules/hea/presentation/HEAPanel";'],
  ["src/app/bootstrap/valid.ts", 'import { createLocalRuntime } from "../../infrastructure/local/runtime";'],
])("permits an intentional dependency in %s", (file, code) => {
  expect(inspect(file, code)).toEqual([]);
});
