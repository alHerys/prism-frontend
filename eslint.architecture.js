import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = path.dirname(fileURLToPath(import.meta.url));
const publicViews = new Set([
  "procurement/ProcurementList", "procurement/ProcurementTable",
  "documents/Review", "documents/DocumentTable", "documents/UploadPanel",
  "hea/HEAPanel", "price-deviation/PDPanel", "historical-prices/BankPage",
  "evaluations/ResultPanel", "evaluations/SnapshotInputs",
]);
const relative = (file) => path.relative(root, file).replaceAll(path.sep, "/");
const stripExtension = (file) => file.replace(/\.(tsx?|jsx?)$/, "");
function resolve(from, specifier) {
  if (specifier.startsWith("@/")) return path.resolve(root, "src", specifier.slice(2));
  return specifier.startsWith(".") ? path.resolve(path.dirname(from), specifier) : null;
}
let graph;
function dependencyGraph() {
  if (graph) return graph;
  graph = new Map();
  const visitDirectory = (directory) => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) { visitDirectory(file); continue; }
      if (!/\.tsx?$/.test(file) || /\.(test|stories)\./.test(file) || file.endsWith("test-session.ts")) continue;
      const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
      const edges = new Set();
      const visit = (node) => {
        let argument;
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) argument = node.moduleSpecifier;
        else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) argument = node.arguments[0];
        else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) argument = node.argument.literal;
        if (argument && ts.isStringLiteral(argument)) {
          const target = resolve(file, argument.text);
          if (target) edges.add(stripExtension(relative(target)));
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
      graph.set(stripExtension(relative(file)), edges);
    }
  };
  visitDirectory(path.join(root, "src"));
  return graph;
}
function reaches(start, destination, visited = new Set()) {
  if (start === destination) return true;
  if (visited.has(start)) return false;
  visited.add(start);
  return [...(dependencyGraph().get(start) ?? [])].some((next) => reaches(next, destination, visited));
}
export const architecture = {
  meta: { type: "problem", schema: [], messages: { boundary: "Architecture boundary: {{reason}}" } },
  create(context) {
    const from = stripExtension(relative(context.filename));
    if (/\.(test|stories)$/.test(from)) return {};
    const match = /^src\/modules\/([^/]+)\/(domain|application|presentation|infrastructure)\//.exec(from);
    const isCore = match && ["domain", "application"].includes(match[2]);
    const report = (node, reason) => context.report({ node, messageId: "boundary", data: { reason } });
    const check = (node) => {
      if (typeof node?.value !== "string") return;
      const destination = resolve(context.filename, node.value);
      if (!destination) {
        if (isCore || from.startsWith("src/shared/kernel/")) report(node, "core code uses language primitives and explicit internal contracts, not framework packages.");
        return;
      }
      const to = stripExtension(relative(destination));
      const target = /^src\/modules\/([^/]+)\/(domain|application|presentation|infrastructure)\//.exec(to);
      let reason;
      if (to.endsWith("/test-session")) reason = "the regression harness is only accessible from tests.";
      else if (from.startsWith("src/shared/") && !to.startsWith("src/shared/")) reason = "shared cannot depend on business modules, pages, bootstrap or adapters.";
      else if (from.startsWith("src/shared/kernel/") && !to.startsWith("src/shared/kernel/")) reason = "kernel cannot import UI or formatting adapters.";
      else if (from.startsWith("src/pages/") && (/^src\/(app|infrastructure)\//.test(to) || target?.[2] === "infrastructure")) reason = "pages compose application/presentation contracts, not bootstrap or adapters.";
      else if (from.startsWith("src/app/") && (to.startsWith("src/infrastructure/") || target?.[2] === "infrastructure") && !["src/infrastructure/local/runtime", "src/modules/evaluations/infrastructure/workbook"].includes(to)) reason = "bootstrap uses declared adapter factories, not mutable implementation internals.";
      else if (match && target && target[1] !== match[1] && !((target[2] === "domain" && to.endsWith("/models")) || (target[2] === "application" && /\/(ports|queries|use-cases)$/.test(to)))) reason = "other modules expose domain models and application contracts, not internal implementation.";
      else if (isCore) {
        const allowed = to.startsWith("src/shared/kernel/") || target?.[2] === "domain" || (match[2] === "application" && target?.[2] === "application" && (target[1] === match[1] || /\/(ports|queries|use-cases)$/.test(to)));
        if (!allowed) reason = "domain/application cannot depend on React, presentation, bootstrap or infrastructure.";
      } else if (from.startsWith("src/infrastructure/") || match?.[2] === "infrastructure") {
        if (/^src\/(app|pages)\//.test(to) || target?.[2] === "presentation" || to.startsWith("src/shared/ui/")) reason = "adapters implement application ports and never import React presentation.";
      } else if (match?.[2] === "presentation") {
        if (/^src\/(app|pages|infrastructure)\//.test(to) || target?.[2] === "infrastructure") reason = "presentation uses application contracts, not adapters or composition roots.";
        else if (target && target[1] !== match[1] && target[2] === "presentation") reason = "compose cross-module views in pages/app instead of importing another module's presentation.";
      } else if (/^src\/(app|pages)\//.test(from) && target?.[2] === "presentation") {
        const view = target[1] + "/" + to.split("/").at(-1);
        if (!to.endsWith("/binding") && !publicViews.has(view)) reason = "composition roots import declared public views/bindings, not internal controllers or views.";
      }
      if (!reason && reaches(to, from)) reason = "circular source dependencies are not allowed, including type-only imports.";
      if (reason) report(node, reason);
    };
    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => {
        if (typeof node.source?.value !== "string") report(node, "dynamic imports must be literal so module boundaries can be checked.");
        else check(node.source);
      },
      TSImportType: (node) => check(node.source ?? node.argument?.literal ?? node.argument),
      MemberExpression: (node) => {
        if (isCore && node.object.type === "Identifier" && node.object.name === "globalThis" && ["document", "window", "File", "Blob", "fetch", "navigator", "localStorage", "sessionStorage"].includes(node.property.name ?? node.property.value)) report(node, "core code cannot access browser globals through globalThis; inject a port.");
      },
      Identifier: (node) => {
        if (isCore && ["window", "document", "localStorage", "sessionStorage", "File", "Blob", "fetch", "navigator", "HTMLElement"].includes(node.name)) {
          const scope = context.sourceCode.getScope(node);
          const reference = [...scope.references, ...scope.through].find((item) => item.identifier === node);
          if (reference && (!reference.resolved || reference.resolved.defs.length === 0)) report(node, "core code cannot reference browser globals; inject a port.");
        }
      },
    };
  },
};
