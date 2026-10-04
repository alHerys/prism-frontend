import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));

const routeEntries = new Set([
  "src/features/dashboard/Dashboard",
  "src/features/procurement/ProcurementList",
  "src/features/procurement/ProcurementDetail",
  "src/features/procurement/VendorDocuments",
  "src/features/review/Review",
  "src/features/bank/BankPage",
  "src/features/history/HistoryPage",
]);

// Resolve paths so equivalent relative imports, re-exports and dynamic imports
// obey the same boundaries. Tests may construct isolated demo services.
export const architecture = {
  meta: {
    type: "problem",
    schema: [],
    messages: { boundary: "Module boundary: {{reason}}" },
  },
  create(context) {
    const filename = context.filename;
    const from = path.relative(repositoryRoot, filename).replaceAll(path.sep, "/");
    if (/\.(test|stories)\.tsx?$/.test(from)) return {};
    const check = (source) => {
      if (typeof source?.value !== "string" || !source.value.startsWith(".")) return;
      const to = path.relative(repositoryRoot, path.resolve(path.dirname(filename), source.value))
        .replaceAll(path.sep, "/").replace(/\.(ts|tsx|js)$/, "");
      let reason;
      if (from.startsWith("src/shared/") && /^src\/(app|features|services|fixtures)\//.test(to))
        reason = "shared only depends on shared modules and external libraries.";
      else if (from.startsWith("src/services/") && /^src\/(app|features)\//.test(to))
        reason = "services cannot import application or feature modules.";
      else if (from.startsWith("src/features/") && to.startsWith("src/app/"))
        reason = "features cannot import application bootstrap.";
      else if (from.startsWith("src/features/") && routeEntries.has(to))
        reason = "compose feature components instead of importing route pages.";
      else if (to.startsWith("src/services/demo/") && !from.startsWith("src/services/demo/") && from !== "src/app/session.ts")
        reason = "access the session contract and React bindings; only bootstrap creates the demo service.";
      else if (from.startsWith("src/features/") && to.startsWith("src/fixtures/"))
        reason = "read document metadata through services instead of importing fixtures.";
      if (reason) context.report({ node: source, messageId: "boundary", data: { reason } });
    };
    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
    };
  },
};
