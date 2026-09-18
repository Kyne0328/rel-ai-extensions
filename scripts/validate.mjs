import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import semver from 'semver';

const MAX_CATALOG_BYTES = 1024 * 1024;
const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_EXTENSION_FILE_BYTES = 1024 * 1024;
const MAX_EXTENSION_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_INSTALL_ARTIFACT_BYTES = 64 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 8000;
const ID_PATTERN = /^[a-z0-9][a-z0-9.-]{0,79}$/;
const COMMAND_PATTERN = /^[A-Za-z0-9._+-]{1,100}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PERMISSIONS = Object.freeze([
  'workspace.read',
  'workspace.write',
  'command.execute',
  'git',
  'network',
  'browser',
  'computer'
]);
const PLATFORMS = Object.freeze(['win32', 'darwin', 'linux']);
const ARCHITECTURES = Object.freeze(['x64', 'arm64']);
const RESERVED_MANAGED_COMMANDS = new Set([
  'bash', 'cmd', 'git', 'node', 'npm', 'npx', 'powershell', 'pwsh', 'python', 'python3',
  'rel-ai-mcp', 'rel-ai-mcp-http', 'sh', 'zsh'
]);
const CANONICAL_RAW_PREFIX = 'https://raw.githubusercontent.com/Kyne0328/rel-ai-extensions/main/';

function fail(label, errors) {
  if (!errors.length) return;
  throw new Error(`${label} is invalid:\n${errors.map(error => `- ${error}`).join('\n')}`);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function checkKeys(value, allowed, label, errors) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label} contains unknown property: ${key}.`);
  }
}

function validText(value, min, max) {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

function validUrl(value) {
  try {
    new URL(String(value || ''));
    return true;
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(String(value || '')).protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeRelativePath(value) {
  const text = String(value || '').replaceAll('\\', '/');
  if (!text || text.startsWith('/') || /^[A-Za-z]:\//.test(text)) return false;
  return text.split('/').every(segment => segment && segment !== '.' && segment !== '..');
}

function sameStringSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function validateManifest(manifest, label = 'extension manifest') {
  const errors = [];
  if (!isRecord(manifest)) fail(label, ['manifest must be a JSON object.']);

  checkKeys(manifest, [
    'schemaVersion', 'id', 'name', 'version', 'description', 'kind', 'compatibility',
    'publisher', 'repository', 'homepage', 'permissions', 'requires', 'entrypoints', 'install', 'files'
  ], 'manifest', errors);
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!validText(manifest.id, 1, 80) || !ID_PATTERN.test(manifest.id)) {
    errors.push('id must match ^[a-z0-9][a-z0-9.-]{0,79}$.');
  }
  if (!validText(manifest.name, 1, 100)) errors.push('name must contain 1 to 100 characters.');
  if (!validText(manifest.version, 1, 80) || !semver.valid(manifest.version)) {
    errors.push('version must be a valid semantic version.');
  }
  if (!validText(manifest.description, 1, 1000)) {
    errors.push('description must contain 1 to 1000 characters.');
  }
  if (!['skill', 'cli'].includes(manifest.kind)) errors.push('kind must be skill or cli.');

  if (!isRecord(manifest.compatibility)) {
    errors.push('compatibility must be an object.');
  } else {
    checkKeys(manifest.compatibility, ['relai'], 'compatibility', errors);
    if (!validText(manifest.compatibility.relai, 1, 100) || !semver.validRange(manifest.compatibility.relai)) {
      errors.push('compatibility.relai must be a valid semantic-version range.');
    }
  }

  if (!isRecord(manifest.publisher)) {
    errors.push('publisher must be an object.');
  } else {
    checkKeys(manifest.publisher, ['name', 'url'], 'publisher', errors);
    if (!validText(manifest.publisher.name, 1, 100)) errors.push('publisher.name must contain 1 to 100 characters.');
    if (manifest.publisher.url !== undefined && !validUrl(manifest.publisher.url)) errors.push('publisher.url must be a valid URL.');
  }

  if (!validUrl(manifest.repository)) errors.push('repository must be a valid URL.');
  if (manifest.homepage !== undefined && !validUrl(manifest.homepage)) errors.push('homepage must be a valid URL.');

  if (!Array.isArray(manifest.permissions) || manifest.permissions.length > PERMISSIONS.length) {
    errors.push(`permissions must be an array with at most ${PERMISSIONS.length} items.`);
  } else {
    const seenPermissions = new Set();
    for (const permission of manifest.permissions) {
      if (!PERMISSIONS.includes(permission)) errors.push(`unknown permission: ${String(permission)}.`);
      if (seenPermissions.has(permission)) errors.push(`duplicate permission: ${String(permission)}.`);
      seenPermissions.add(permission);
    }
  }

  if (!isRecord(manifest.requires)) {
    errors.push('requires must be an object.');
  } else {
    checkKeys(manifest.requires, ['commands', 'platforms'], 'requires', errors);
    if (!Array.isArray(manifest.requires.commands) || manifest.requires.commands.length > 20) {
      errors.push('requires.commands must be an array with at most 20 items.');
    } else {
      for (const command of manifest.requires.commands) {
        if (typeof command !== 'string' || !COMMAND_PATTERN.test(command)) {
          errors.push(`invalid required command: ${String(command)}.`);
        }
      }
    }
    if (!Array.isArray(manifest.requires.platforms) || manifest.requires.platforms.length > 3) {
      errors.push('requires.platforms must be an array with at most 3 items.');
    } else {
      const seenPlatforms = new Set();
      for (const platform of manifest.requires.platforms) {
        if (!PLATFORMS.includes(platform)) errors.push(`unknown platform: ${String(platform)}.`);
        if (seenPlatforms.has(platform)) errors.push(`duplicate platform: ${String(platform)}.`);
        seenPlatforms.add(platform);
      }
    }
  }

  const filePaths = new Set();
  if (!Array.isArray(manifest.files) || manifest.files.length < 1 || manifest.files.length > 64) {
    errors.push('files must contain 1 to 64 items.');
  } else {
    for (const [index, file] of manifest.files.entries()) {
      if (!isRecord(file)) {
        errors.push(`files[${index}] must be an object.`);
        continue;
      }
      checkKeys(file, ['path', 'sha256'], `files[${index}]`, errors);
      if (!validText(file.path, 1, 240) || !isSafeRelativePath(file.path)) {
        errors.push(`files[${index}].path must be a safe relative path.`);
      } else if (filePaths.has(file.path)) {
        errors.push(`duplicate file path: ${file.path}.`);
      } else {
        filePaths.add(file.path);
      }
      if (typeof file.sha256 !== 'string' || !SHA256_PATTERN.test(file.sha256)) {
        errors.push(`files[${index}].sha256 must be a lowercase SHA-256 value.`);
      }
    }
  }

  if (!isRecord(manifest.entrypoints)) {
    errors.push('entrypoints must be an object.');
  } else {
    checkKeys(manifest.entrypoints, ['skill', 'command'], 'entrypoints', errors);
    if (!validText(manifest.entrypoints.skill, 1, 240) || !isSafeRelativePath(manifest.entrypoints.skill)) {
      errors.push('entrypoints.skill must be a safe relative path.');
    } else if (!filePaths.has(manifest.entrypoints.skill)) {
      errors.push('entrypoints.skill must name a declared package file.');
    }

    if (manifest.entrypoints.command !== undefined &&
        (typeof manifest.entrypoints.command !== 'string' || !COMMAND_PATTERN.test(manifest.entrypoints.command))) {
      errors.push('entrypoints.command contains invalid characters.');
    }

    if (manifest.kind === 'cli') {
      if (!manifest.entrypoints.command) {
        errors.push('CLI extensions require entrypoints.command.');
      } else if (!Array.isArray(manifest.requires?.commands) ||
                 !manifest.requires.commands.includes(manifest.entrypoints.command)) {
        errors.push('CLI extensions must list entrypoints.command in requires.commands.');
      }
      if (!Array.isArray(manifest.permissions) || !manifest.permissions.includes('command.execute')) {
        errors.push('CLI extensions must declare command.execute.');
      }
    }
  }

  if (manifest.install !== undefined) {
    if (manifest.kind !== 'cli') errors.push('Only CLI extensions may declare install artifacts.');
    if (!isRecord(manifest.install)) {
      errors.push('install must be an object.');
    } else {
      checkKeys(manifest.install, ['type', 'artifacts'], 'install', errors);
      if (manifest.install.type !== 'binary') errors.push("install.type must be 'binary'.");
      const command = String(manifest.entrypoints?.command || '').toLowerCase().replace(/\.(?:exe|cmd|bat|com)$/i, '');
      if (RESERVED_MANAGED_COMMANDS.has(command)) errors.push('entrypoints.command is reserved and cannot be auto-installed.');
      if (!Array.isArray(manifest.install.artifacts) || manifest.install.artifacts.length < 1 || manifest.install.artifacts.length > 12) {
        errors.push('install.artifacts must contain 1 to 12 items.');
      } else {
        const targets = new Set();
        for (const [index, artifact] of manifest.install.artifacts.entries()) {
          if (!isRecord(artifact)) {
            errors.push(`install.artifacts[${index}] must be an object.`);
            continue;
          }
          checkKeys(artifact, ['platform', 'arch', 'url', 'sha256'], `install.artifacts[${index}]`, errors);
          if (!PLATFORMS.includes(artifact.platform)) errors.push(`install.artifacts[${index}].platform is invalid.`);
          if (!ARCHITECTURES.includes(artifact.arch)) errors.push(`install.artifacts[${index}].arch is invalid.`);
          if (!isHttpsUrl(artifact.url)) errors.push(`install.artifacts[${index}].url must use HTTPS.`);
          if (typeof artifact.sha256 !== 'string' || !SHA256_PATTERN.test(artifact.sha256)) {
            errors.push(`install.artifacts[${index}].sha256 must be a lowercase SHA-256 value.`);
          }
          const target = `${artifact.platform}/${artifact.arch}`;
          if (targets.has(target)) errors.push(`duplicate install artifact target: ${target}.`);
          targets.add(target);
        }
      }
    }
  }

  fail(label, errors);
  return manifest;
}

function validateCatalog(catalog, label = 'extension catalog') {
  const errors = [];
  if (!isRecord(catalog)) fail(label, ['catalog must be a JSON object.']);

  checkKeys(catalog, ['schemaVersion', 'updatedAt', 'extensions'], 'catalog', errors);
  if (catalog.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!validText(catalog.updatedAt, 1, 80)) errors.push('updatedAt must contain 1 to 80 characters.');
  if (!Array.isArray(catalog.extensions) || catalog.extensions.length > 500) {
    errors.push('extensions must be an array with at most 500 items.');
  } else {
    const ids = new Set();
    for (const [index, entry] of catalog.extensions.entries()) {
      if (!isRecord(entry)) {
        errors.push(`extensions[${index}] must be an object.`);
        continue;
      }
      checkKeys(entry, [
        'id', 'name', 'version', 'description', 'kind', 'manifestUrl',
        'repository', 'publisher', 'permissions', 'autoInstall', 'featured'
      ], `extensions[${index}]`, errors);
      if (!validText(entry.id, 1, 80) || !ID_PATTERN.test(entry.id)) {
        errors.push(`extensions[${index}].id is invalid.`);
      } else if (ids.has(entry.id)) {
        errors.push(`duplicate extension id: ${entry.id}.`);
      } else {
        ids.add(entry.id);
      }
      if (!validText(entry.name, 1, 100)) errors.push(`extensions[${index}].name is invalid.`);
      if (!validText(entry.version, 1, 80) || !semver.valid(entry.version)) {
        errors.push(`extensions[${index}].version must be a valid semantic version.`);
      }
      if (!validText(entry.description, 1, 1000)) errors.push(`extensions[${index}].description is invalid.`);
      if (!['skill', 'cli'].includes(entry.kind)) errors.push(`extensions[${index}].kind must be skill or cli.`);
      if (!isHttpsUrl(entry.manifestUrl)) errors.push(`extensions[${index}].manifestUrl must use HTTPS.`);
      if (!validUrl(entry.repository)) errors.push(`extensions[${index}].repository must be a valid URL.`);
      if (!validText(entry.publisher, 1, 100)) errors.push(`extensions[${index}].publisher is invalid.`);
      if (!Array.isArray(entry.permissions) || entry.permissions.length > PERMISSIONS.length) {
        errors.push(`extensions[${index}].permissions is invalid.`);
      } else {
        const seenPermissions = new Set();
        for (const permission of entry.permissions) {
          if (!PERMISSIONS.includes(permission)) errors.push(`extensions[${index}] has unknown permission ${String(permission)}.`);
          if (seenPermissions.has(permission)) errors.push(`extensions[${index}] has duplicate permission ${String(permission)}.`);
          seenPermissions.add(permission);
        }
      }
      if (entry.autoInstall !== undefined && typeof entry.autoInstall !== 'boolean') {
        errors.push(`extensions[${index}].autoInstall must be true or false.`);
      }
      if (entry.featured !== undefined && typeof entry.featured !== 'boolean') {
        errors.push(`extensions[${index}].featured must be true or false.`);
      }
    }
  }

  fail(label, errors);
  return catalog;
}

function readJsonFile(filePath, maxBytes, label) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) throw new Error(`${label} is not a file: ${filePath}`);
  if (stat.size > maxBytes) throw new Error(`${label} exceeds the allowed size: ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label} contains invalid JSON: ${filePath}`, { cause: error });
  }
}

function verifyLocalFiles(manifestPath, manifest) {
  const root = path.dirname(path.resolve(manifestPath));
  let totalBytes = 0;
  for (const file of manifest.files) {
    const target = path.resolve(root, file.path);
    const relative = path.relative(root, target);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Unsafe package path: ${file.path}`);
    }
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Package file is missing or unsafe: ${file.path}`);
    if (stat.size > MAX_EXTENSION_FILE_BYTES) throw new Error(`Package file exceeds 1 MiB: ${file.path}`);
    totalBytes += stat.size;
    if (totalBytes > MAX_EXTENSION_TOTAL_BYTES) throw new Error('Package exceeds the 8 MiB total size limit.');
    const digest = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    if (digest !== file.sha256) {
      throw new Error(`SHA-256 mismatch for ${file.path}. Expected ${file.sha256}, got ${digest}.`);
    }
  }
}

function validateLocalManifest(manifestPath) {
  const resolved = path.resolve(manifestPath);
  const manifest = validateManifest(readJsonFile(resolved, MAX_MANIFEST_BYTES, 'extension manifest'), resolved);
  verifyLocalFiles(resolved, manifest);
  return manifest;
}

async function fetchBytes(url, maxBytes, label, options = {}) {
  if (!isHttpsUrl(url)) throw new Error(`${label} URL must use HTTPS.`);
  const controller = new AbortController();
  const timeoutMs = Math.min(120_000, Math.max(1_000, Number(options.timeoutMs) || REQUEST_TIMEOUT_MS));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Rel.AI-Extensions-Validator/1' }
    });
    if (!response.ok) throw new Error(`Could not download ${label}: HTTP ${response.status}.`);
    if (!isHttpsUrl(response.url || url)) throw new Error(`${label} redirected to a non-HTTPS URL.`);
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > maxBytes) throw new Error(`${label} exceeds the allowed size.`);
    const content = Buffer.from(await response.arrayBuffer());
    if (content.length > maxBytes) throw new Error(`${label} exceeds the allowed size.`);
    return content;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`Timed out downloading ${label}.`, { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, maxBytes, label) {
  const content = await fetchBytes(url, maxBytes, label);
  try {
    return JSON.parse(content.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} contains invalid JSON.`, { cause: error });
  }
}

function canonicalLocalManifestPath(manifestUrl, repoRoot) {
  if (!manifestUrl.startsWith(CANONICAL_RAW_PREFIX)) return '';
  const relative = decodeURIComponent(manifestUrl.slice(CANONICAL_RAW_PREFIX.length));
  if (!isSafeRelativePath(relative)) return '';
  const target = path.resolve(repoRoot, relative);
  return fs.existsSync(target) ? target : '';
}

async function validateCatalogEntry(entry, repoRoot) {
  const localManifestPath = canonicalLocalManifestPath(entry.manifestUrl, repoRoot);
  let manifest;
  let localRoot = '';

  if (localManifestPath) {
    manifest = validateManifest(
      readJsonFile(localManifestPath, MAX_MANIFEST_BYTES, 'extension manifest'),
      localManifestPath
    );
    localRoot = path.dirname(localManifestPath);
  } else {
    manifest = validateManifest(
      await fetchJson(entry.manifestUrl, MAX_MANIFEST_BYTES, `manifest for ${entry.id}`),
      `manifest for ${entry.id}`
    );
  }

  if (manifest.id !== entry.id) throw new Error(`${entry.id}: catalog id does not match the manifest.`);
  if (manifest.version !== entry.version) throw new Error(`${entry.id}: catalog version does not match the manifest.`);
  if (manifest.kind !== entry.kind) throw new Error(`${entry.id}: catalog kind does not match the manifest.`);
  if (!sameStringSet(manifest.permissions, entry.permissions)) {
    throw new Error(`${entry.id}: catalog permissions do not match the manifest.`);
  }
  if (Boolean(manifest.install) !== Boolean(entry.autoInstall)) {
    throw new Error(`${entry.id}: catalog autoInstall does not match the manifest.`);
  }

  if (localRoot) {
    verifyLocalFiles(localManifestPath, manifest);
  } else {
    let totalBytes = 0;
    for (const file of manifest.files) {
      const fileUrl = new URL(file.path.replaceAll('\\', '/'), entry.manifestUrl).href;
      const content = await fetchBytes(fileUrl, MAX_EXTENSION_FILE_BYTES, `${entry.id}/${file.path}`);
      totalBytes += content.length;
      if (totalBytes > MAX_EXTENSION_TOTAL_BYTES) throw new Error(`${entry.id}: package exceeds the 8 MiB total size limit.`);
      const digest = crypto.createHash('sha256').update(content).digest('hex');
      if (digest !== file.sha256) {
        throw new Error(`${entry.id}/${file.path}: SHA-256 mismatch. Expected ${file.sha256}, got ${digest}.`);
      }
    }
  }
  for (const artifact of manifest.install?.artifacts || []) {
    const content = await fetchBytes(
      artifact.url,
      MAX_INSTALL_ARTIFACT_BYTES,
      `${entry.id} binary ${artifact.platform}/${artifact.arch}`,
      { timeoutMs: 120_000 }
    );
    const digest = crypto.createHash('sha256').update(content).digest('hex');
    if (digest !== artifact.sha256) {
      throw new Error(`${entry.id} binary ${artifact.platform}/${artifact.arch}: SHA-256 mismatch. Expected ${artifact.sha256}, got ${digest}.`);
    }
  }
}

async function validateCatalogFile(catalogPath, repoRoot = process.cwd()) {
  const resolved = path.resolve(catalogPath);
  const catalog = validateCatalog(readJsonFile(resolved, MAX_CATALOG_BYTES, 'extension catalog'), resolved);
  for (const entry of catalog.extensions) {
    await validateCatalogEntry(entry, path.resolve(repoRoot));
  }
  return catalog;
}

function discoverExampleManifests(repoRoot) {
  const examplesRoot = path.join(repoRoot, 'examples');
  if (!fs.existsSync(examplesRoot)) return [];
  return fs.readdirSync(examplesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.isSymbolicLink())
    .map(entry => path.join(examplesRoot, entry.name, 'relai-extension.json'))
    .filter(file => fs.existsSync(file))
    .sort();
}

async function run(argv = process.argv.slice(2)) {
  const repoRoot = process.cwd();
  const [command, target] = argv;

  if (!command) {
    for (const manifestPath of discoverExampleManifests(repoRoot)) {
      validateLocalManifest(manifestPath);
      console.log(`OK manifest ${path.relative(repoRoot, manifestPath)}`);
    }
    await validateCatalogFile(path.join(repoRoot, 'catalog.json'), repoRoot);
    console.log('OK catalog catalog.json');
    return;
  }

  if (command === 'manifest') {
    if (!target) throw new Error('Usage: node scripts/validate.mjs manifest <relai-extension.json>');
    validateLocalManifest(target);
    console.log(`OK manifest ${target}`);
    return;
  }

  if (command === 'catalog') {
    const catalogPath = target || 'catalog.json';
    await validateCatalogFile(catalogPath, repoRoot);
    console.log(`OK catalog ${catalogPath}`);
    return;
  }

  throw new Error(
    'Usage:\n' +
    '  node scripts/validate.mjs\n' +
    '  node scripts/validate.mjs manifest <relai-extension.json>\n' +
    '  node scripts/validate.mjs catalog [catalog.json]'
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export {
  PERMISSIONS,
  validateCatalog,
  validateCatalogFile,
  validateLocalManifest,