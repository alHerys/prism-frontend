import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { digest, localPackage } from "./pertamina-package.mjs";
const data = fileURLToPath(new URL("../../data-pertamina/", import.meta.url));
const bytes = Buffer.from(JSON.stringify(localPackage(data)));
const output = fileURLToPath(new URL("../../data-pertamina/demo/pertamina-deployment.json", import.meta.url));
writeFileSync(output, bytes);
console.log(`Paket deployment di luar GitHub: ${output}`);
console.log(`PRISM_PERTAMINA_PACKAGE_SHA256=${digest(bytes)}`);
