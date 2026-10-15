import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const fail = () => { throw new Error("Paket pengadaan tidak valid atau hash sumber berubah."); };

/** The same verified asset list powers localhost and static deployment. */
export function packageAssets(bundle) {
  const { catalog, files } = bundle;
  if (catalog?.version !== 1 || catalog.sources?.length !== 4 || !Array.isArray(files) || files.length !== 4) fail();
  const assets = new Map();
  const cleanCatalog = structuredClone(catalog);
  for (const source of cleanCatalog.sources) {
    if (!/^(PD|HEA)-\d{3}$/.test(source.id) || source.path !== `/_pertamina/source/${source.id}` || assets.has(source.path) || !["FORM_A5", "OE", "OFFER"].includes(source.kind)) fail();
    const matches = files.filter(file => file.id === source.id);
    if (matches.length !== 1 || typeof matches[0].base64 !== "string" || matches[0].base64.length > 14 * 1024 * 1024) fail();
    const bytes = Buffer.from(matches[0].base64, "base64");
    if (digest(bytes) !== source.sha256) fail();
    assets.set(source.path, { bytes, mime: source.kind === "FORM_A5" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    delete source.relativePath;
  }
  assets.set("/_pertamina/catalog.json", { bytes: Buffer.from(JSON.stringify(cleanCatalog)), mime: "application/json" });
  return assets;
}

export function localPackage(data) {
  const catalog = JSON.parse(readFileSync(path.join(data, "demo/pertamina-v1/catalog.json"), "utf8"));
  const files = catalog.sources.map(source => {
    const resolved = path.resolve(data, source.relativePath);
    if (!resolved.startsWith(path.join(data, "raw") + path.sep)) fail();
    return { id: source.id, base64: readFileSync(resolved).toString("base64") };
  });
  const assets = packageAssets({ catalog, files });
  return { catalog: JSON.parse(assets.get("/_pertamina/catalog.json").bytes.toString()), files };
}

export async function remotePackage(url, expectedHash) {
  if (new URL(url).protocol !== "https:" || !/^[a-f0-9]{64}$/.test(expectedHash ?? "")) throw new Error("Paket deployment memerlukan URL HTTPS dan SHA-256 yang valid.");
  // Never include the URL in errors: it may contain a signed access token.
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) fail();
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 60 * 1024 * 1024) fail();
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    if (digest(bytes) !== expectedHash) fail();
    const bundle = JSON.parse(bytes.toString());
    packageAssets(bundle);
    return bundle;
  } catch { throw new Error("Paket deployment tidak dapat diverifikasi. Periksa URL, masa berlaku, dan SHA-256."); }
}
