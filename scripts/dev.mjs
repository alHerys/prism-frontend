import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const hasLocalData = existsSync(fileURLToPath(new URL("../../data-pertamina/source-register.local.md", import.meta.url)));
const script = hasLocalData ? ["scripts/pertamina-demo.mjs", ...process.argv.slice(2)] : ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", ...process.argv.slice(2)];
const child = spawn(process.execPath, script, { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", () => { process.exitCode = 1; });
child.on("exit", code => process.exit(code ?? 1));
