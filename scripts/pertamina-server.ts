import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";
import { localPackage, packageAssets, remotePackage } from "./pertamina-package.mjs";

/** Allowlisted assets are served locally or emitted into the static build. */
export async function pertaminaServer(): Promise<Plugin> {
  const bundle = process.env.PRISM_PERTAMINA_PACKAGE_URL
    ? await remotePackage(process.env.PRISM_PERTAMINA_PACKAGE_URL, process.env.PRISM_PERTAMINA_PACKAGE_SHA256)
    : localPackage(fileURLToPath(new URL("../../data-pertamina/", import.meta.url)));
  const assets = packageAssets(bundle);
  return {
    name: "prism-pertamina-assets",
    generateBundle() {
      for (const [url, asset] of assets) this.emitFile({ type: "asset", fileName: url.slice(1), source: asset.bytes });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split("?")[0] ?? "";
        if (!url.startsWith("/_pertamina/")) return next();
        const asset = assets.get(url);
        if (!asset || !["GET", "HEAD"].includes(request.method ?? "")) { response.statusCode = 404; response.end(); return; }
        response.setHeader("Content-Type", asset.mime); response.setHeader("Cache-Control", "no-store");
        response.setHeader("Content-Length", asset.bytes.length);
        response.end(request.method === "HEAD" ? undefined : asset.bytes);
      });
    },
  };
}
