import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));
const bundled = `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`;
const python = process.env.PRISM_PYTHON || (existsSync(bundled) ? bundled : "python3");
const prepared = spawnSync(python, ["scripts/pertamina/prepare.py"], { cwd, stdio: "inherit" });
if (prepared.error || prepared.status !== 0) process.exit(prepared.status || 1);
const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--mode", "pertamina", "--host", "127.0.0.1", "--port", process.env.PRISM_DEMO_PORT || "5173", ...process.argv.slice(2)], { cwd, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code || 0));
