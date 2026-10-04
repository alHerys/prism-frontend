import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
let config = process.env.PRISM_STORYBOOK_CONFIG_DIR;
if (!config) {
  try { config = execFileSync('git', ['config', '--local', '--get', 'prism.storybookConfigDir'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { /* Configuration is optional and intentionally local. */ }
}
if (!config || !existsSync(path.resolve(root, config))) {
  console.error('Konfigurasi Storybook lokal belum tersedia. Atur PRISM_STORYBOOK_CONFIG_DIR.');
  process.exit(1);
}
const [mode, ...args] = process.argv.slice(2);
if (!['dev', 'build'].includes(mode)) throw new Error('Expected Storybook dev or build.');
if (mode === 'build' && !args.includes('--output-dir') && !args.includes('-o')) args.push('--output-dir', path.resolve(root, config, '../storybook-static'));
const child = spawnSync(process.execPath, [path.join(root, 'node_modules/.bin/storybook'), mode, '--config-dir', path.resolve(root, config), ...args], { cwd: root, stdio: 'inherit' });
if (child.error) throw child.error;
process.exit(child.status ?? 1);
