import { createHash } from 'node:crypto';
import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(await readFile(path.join(root, 'src/fixtures/file-registry.json'), 'utf8'));
const kit = path.join(root, 'demo-kit');
const groups = {FORM_A5: '01-HEA', OE: '02-Harga-Timpang', OFFER: '02-Harga-Timpang', HISTORICAL_OE: '03-Bank-OE'};

// Verify every source before producing the kit. Never modify original fixtures.
for (const file of registry) {
  const bytes = await readFile(path.join(root, 'public', file.path));
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) {
    throw new Error(`Fingerprint tidak cocok: ${file.name}. Perbaiki fixture/registri sebelum demo.`);
  }
}
await mkdir(kit, {recursive: true});
for (const file of registry) {
  const folder = path.join(kit, groups[file.kind]);
  await mkdir(folder, {recursive: true});
  await copyFile(path.join(root, 'public', file.path), path.join(folder, file.name));
}
await copyFile(path.join(root, 'DEMO-GUIDE.md'), path.join(kit, 'PANDUAN-DEMO.md'));
await writeFile(path.join(kit, 'manifest.json'), JSON.stringify({
  mode: 'offline-synthetic',
  files: registry.map(({name, kind, sha256}) => ({name, kind, sha256, folder: groups[kind]})),
}, null, 2));
console.log(`Paket demo siap: ${kit}\n${registry.length} berkas PDF/XLSX terverifikasi. Panduan: PANDUAN-DEMO.md`);
