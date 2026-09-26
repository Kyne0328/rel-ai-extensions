import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_PATH = path.join(ROOT, 'catalog.json');
const OFFICECLI_MANIFEST_URL = 'https://raw.githubusercontent.com/Kyne0328/rel-ai-extension-officecli/main/relai-extension.json';
const write = process.argv.includes('--write');

const response = await fetch(OFFICECLI_MANIFEST_URL, {
  headers: {
    accept: 'application/json',
    'user-agent': 'rel-ai-extensions-catalog-sync'
  }
});
if (!response.ok) throw new Error(`OfficeCLI manifest lookup failed: HTTP ${response.status}`);
const manifest = await response.json();

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const entry = (catalog.extensions || []).find(item => item.id === 'officecli');
if (!entry) throw new Error('officecli is missing from catalog.json');

const next = {
  ...entry,
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  kind: manifest.kind,
  manifestUrl: OFFICECLI_MANIFEST_URL,
  repository: manifest.repository,
  publisher: manifest.publisher?.name || entry.publisher,
  permissions: manifest.permissions,
  autoInstall: Boolean(manifest.install)
};

if (JSON.stringify(entry) === JSON.stringify(next)) {
  console.log(`OfficeCLI catalog is current at extension version ${entry.version}.`);
  process.exit(0);
}

Object.assign(entry, next);
catalog.updatedAt = new Date().toISOString();

if (!write) {
  console.log(JSON.stringify({
    updateAvailable: true,
    currentVersion: entry.version,
    nextVersion: manifest.version
  }, null, 2));
  process.exit(0);
}

fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Synchronized OfficeCLI catalog to extension version ${manifest.version}.`);
