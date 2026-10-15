import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Only registered assets are exposed; this is not a general workspace file server. */
export function pertaminaServer(): Plugin {
  const data = fileURLToPath(new URL("../../data-pertamina/", import.meta.url));
  const catalogBytes = readFileSync(path.join(data, "demo/pertamina-v1/catalog.json"));
  const catalog = JSON.parse(catalogBytes.toString());
  const assets = new Map<string, { bytes: Buffer; mime: string }>();
  for (const source of catalog.sources as { path: string; relativePath: string; sha256: string; kind: string }[]) {
    const resolved = path.resolve(data, source.relativePath);
    if (!resolved.startsWith(path.join(data, "raw") + path.sep)) throw new Error("Sumber lokal di luar daftar yang diizinkan.");
    const bytes = readFileSync(resolved);
    if (createHash("sha256").update(bytes).digest("hex") !== source.sha256) throw new Error("Hash sumber lokal berubah. Siapkan ulang paket.");
    assets.set(source.path, { bytes, mime: source.kind === "FORM_A5" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  // Paths on the host are not part of the browser contract.
  for (const source of catalog.sources) delete source.relativePath;
  const publicCatalog = Buffer.from(JSON.stringify(catalog));
  return {
    name: "prism-pertamina-local",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split("?")[0] ?? "";
        if (!url.startsWith("/_pertamina/")) return next();
        const asset = url === "/_pertamina/catalog.json" ? { bytes: publicCatalog, mime: "application/json" } : assets.get(url);
        if (!asset || !["GET", "HEAD"].includes(request.method ?? "")) { response.statusCode = 404; response.end(); return; }
        response.setHeader("Content-Type", asset.mime); response.setHeader("Cache-Control", "no-store");
        response.setHeader("Content-Length", asset.bytes.length);
        response.end(request.method === "HEAD" ? undefined : asset.bytes);
      });
    },
  };
}
