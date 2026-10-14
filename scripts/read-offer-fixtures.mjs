import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import { readFile, writeFile } from 'node:fs/promises';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { parseOfferSpreadsheet } = await server.ssrLoadModule('/src/infrastructure/spreadsheet/offer-parser.ts');
  const registry = JSON.parse(await readFile('src/infrastructure/local/fixtures/file-registry.json', 'utf8'));
  const tables = {};
  for (const file of registry.filter(f => f.kind === 'OFFER')) {
    const [sheet] = await parseOfferSpreadsheet(new Uint8Array(await readFile('public' + file.path)).buffer);
    tables[file.id] = sheet;
  }
  await writeFile('src/infrastructure/local/fixtures/offer-review.json', JSON.stringify(tables, null, 2) + '\n');
} finally { await server.close(); }
