// @vitest-environment node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tmpdir } from "node:os";
import { expect, it } from "vitest";
import registry from "./infrastructure/local/fixtures/file-registry.json";
const root = fileURLToPath(new URL("../", import.meta.url));
const markdown = ["README.md", "tests/README.md", "src/infrastructure/local/fixtures/README.md"];
it("keeps active Markdown links and npm commands valid without obsolete framing", () => {
  const scripts = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).scripts as Record<string, string>;
  for (const name of markdown) {
    const text = readFileSync(path.join(root, name), "utf8");
    expect(text, name).not.toMatch(/\bdemo\b|frontendnstration|implementationnstration|\brehearsal\b|\bpresenter\b/i);
    for (const match of text.matchAll(/npm run ([\w:-]+)/g)) expect(scripts[match[1]], `${name}: ${match[1]}`).toBeTruthy();
    for (const match of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^https?:/.test(target)) continue;
      expect(existsSync(path.resolve(root, path.dirname(name), target)), `${name}: ${target}`).toBe(true);
    }
  }
});
it("prepares the fixture kit with original bytes and an optional external guide", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "prism-external-guide-"));
  const guidePath = path.join(temporary, "workflow.md");
  const expectedGuide = "# Workflow fixture\n";
  writeFileSync(guidePath, expectedGuide);
  try {
    execFileSync(process.execPath, ["scripts/prepare-fixtures.mjs"], { cwd: root, env: { ...process.env, PRISM_WORKFLOW_GUIDE: guidePath } });
  } finally { rmSync(temporary, { recursive: true, force: true }); }
  const manifest = JSON.parse(readFileSync(path.join(root, "fixture-kit/manifest.json"), "utf8")) as { files: { name: string; sha256: string; folder: string }[] };
  expect(manifest.files).toHaveLength(8);
  for (const file of manifest.files) {
    const copied = readFileSync(path.join(root, "fixture-kit", file.folder, file.name));
    expect(createHash("sha256").update(copied).digest("hex")).toBe(file.sha256);
    const original = registry.find((source) => source.name === file.name)!;
    expect(copied.equals(readFileSync(path.join(root, "public", original.path)))).toBe(true);
  }
  const guide = readFileSync(path.join(root, "fixture-kit/PANDUAN-WORKFLOW.md"), "utf8");
  expect(guide).toBe(expectedGuide);
  expect(guide).not.toMatch(/\bdemo\b|\bpresenter\b/i);
  execFileSync(process.execPath, ["scripts/prepare-fixtures.mjs"], { cwd: root, env: { ...process.env, PRISM_WORKFLOW_GUIDE: "" } });
  expect(existsSync(path.join(root, "fixture-kit/PANDUAN-WORKFLOW.md"))).toBe(false);
});
