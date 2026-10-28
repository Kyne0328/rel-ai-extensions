#!/usr/bin/env node
// Standalone optional Camoufox tool. No imports from Rel.AI's application runtime.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const CAMOUFOX_VERSION = '0.5.8';
const PLAYWRIGHT_VERSION = '1.62.0';
const NPM_VERSION = '12.1.0';
const supported = ['win32', 'darwin', 'linux'];
const home = path.resolve(process.env.REL_AI_CAMOUFOX_HOME || path.join(os.homedir(), '.relai-camoufox'));
const runtime = path.join(home, 'runtime');
const packagePath = path.join(runtime, 'node_modules', 'camoufox');
const actions = new Set(['help', 'status', 'setup', 'open', 'snapshot', 'click', 'fill', 'screenshot']);

function options(argv) {
  const action = argv[0] || 'help';
  if (!actions.has(action)) throw new Error('Unknown action. Use help to see supported commands.');
  const flags = {};
  for (let i = 1; i < argv.length; i += 1) {
    const key = argv[i];
    if (!/^--(url|profile|selector|text|output|download-browser)$/.test(key)) throw new Error('Unknown argument: ' + key);
    if (key === '--download-browser') { flags.downloadBrowser = true; continue; }
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Missing value for ' + key);
    flags[key.slice(2)] = argv[++i];
  }
  return { action, flags };
}

function profileName(value) {
  const name = String(value || 'default');
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(name)) throw new Error('Profile name must contain only lowercase letters, numbers, _ or -.');
  return name;
}

function targetUrl(value) {
  if (!value) return '';
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  return parsed.href;
}

function verifiedFile(file, label) {
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(label + ' must be a regular file.');
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function safeDirectory(directory) {
  const resolved = path.resolve(directory);
  const segments = [];
  for (let current = resolved; current !== path.dirname(current); current = path.dirname(current)) segments.push(current);
  for (const segment of segments.reverse()) {
    try {
      const stat = fs.lstatSync(segment);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Unsafe profile or runtime directory: ' + segment);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  fs.mkdirSync(resolved, { recursive: true, mode: 0o700 });
  return resolved;
}

async function launcher() {
  if (!verifiedFile(path.join(packagePath, 'package.json'), 'Camoufox launcher')) {
    throw new Error('Camoufox is not installed for this extension. Run setup --download-browser first.');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
  if (pkg.version !== CAMOUFOX_VERSION) throw new Error('Camoufox launcher version differs from this extension.');
  return import(pathToFileURL(path.join(packagePath, 'dist', 'index.js')).href);
}

async function pkgman() {
  await launcher();
  return import(pathToFileURL(path.join(packagePath, 'dist', 'pkgman.js')).href);
}

let lastSetupReport = 0;
function reportSetup(phase, downloadedBytes = 0, totalBytes = null) {
  const file = String(process.env.REL_AI_EXTENSION_PROGRESS_FILE || '');
  if (!file) return;
  const now = Date.now();
  if (downloadedBytes && now - lastSetupReport < 200 && (!totalBytes || downloadedBytes !== totalBytes)) return;
  lastSetupReport = now;
  try { fs.writeFileSync(file, JSON.stringify({ phase, downloadedBytes, totalBytes }), { mode: 0o600 }); } catch {}
}

async function provisionNpm() {
  const npmRoot = path.join(runtime, 'npm-bootstrap');
  const cli = path.join(npmRoot, 'bin', 'npm-cli.js');
  if (verifiedFile(cli, 'npm CLI')) return cli;
  reportSetup('Downloading npm installer');
  const registryUrl = 'https://registry.npmjs.org/npm/' + NPM_VERSION;
  const metadataResponse = await fetch(registryUrl);
  if (!metadataResponse.ok) throw new Error('Could not fetch pinned npm package metadata.');
  const metadata = await metadataResponse.json();
  const tarball = new URL(metadata?.dist?.tarball || '');
  const integrity = String(metadata?.dist?.integrity || '');
  if (metadata.version !== NPM_VERSION || tarball.protocol !== 'https:' || tarball.hostname !== 'registry.npmjs.org'
    || !/^sha512-[A-Za-z0-9+/=]+$/.test(integrity)) throw new Error('Unexpected npm installer metadata.');
  const archiveResponse = await fetch(tarball);
  if (!archiveResponse.ok || Number(archiveResponse.headers.get('content-length') || 0) > 20 * 1024 * 1024)
    throw new Error('Npm installer download exceeds the size limit or is unavailable.');
  const archive = Buffer.from(await archiveResponse.arrayBuffer());
  if (archive.length > 20 * 1024 * 1024 || 'sha512-' + createHash('sha512').update(archive).digest('base64') !== integrity)
    throw new Error('Npm installer checksum mismatch.');
  safeDirectory(npmRoot);
  const archivePath = path.join(runtime, '.npm-bootstrap.tar.gz');
  try {
    fs.writeFileSync(archivePath, archive, { mode: 0o600, flag: 'wx' });
    const entries = spawnSync('tar', ['-tzf', archivePath], { encoding: 'utf8', timeout: 120000 });
    if (entries.error || entries.status !== 0 || !entries.stdout.split(/\r?\n/).filter(Boolean).every(name =>
      name.startsWith('package/') && !name.split('/').includes('..'))) throw new Error('Npm archive contains unsafe file paths.');
    const unpacked = spawnSync('tar', ['-xzf', archivePath, '-C', npmRoot, '--strip-components=1'],
      { encoding: 'utf8', timeout: 120000 });
    if (unpacked.error || unpacked.status !== 0 || !verifiedFile(cli, 'npm CLI'))
      throw new Error('Could not unpack the npm installer. A supported tar program is required.');
  } finally { fs.rmSync(archivePath, { force: true }); }
  return cli;
}

async function setup(downloadBrowser) {
  if (!downloadBrowser) throw new Error('Installation downloads a large browser archive. Rerun with setup --download-browser after confirming the download.');
  reportSetup('Installing Camoufox JavaScript dependencies');
  safeDirectory(runtime);
  const npmCandidates = [process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')];
  const npmCli = npmCandidates.find(file => file && verifiedFile(file, 'npm CLI')) || await provisionNpm();
  const args = ['install', '--prefix', runtime, '--no-audit', '--no-fund', '--ignore-scripts', '--save-exact',
    'camoufox@' + CAMOUFOX_VERSION, 'playwright-core@' + PLAYWRIGHT_VERSION];
  const completed = spawnSync(process.execPath, [npmCli, ...args], { stdio: 'inherit', shell: false });
  if (completed.error) throw completed.error;
  if (completed.status !== 0) throw new Error('Isolated Camoufox launcher installation failed.');
  reportSetup('Downloading Camoufox browser (large archive)');
  const manager = await pkgman();
  // Camoufox explicitly supports a custom downloadFile implementation.
  // Reuse its own verified downloader and stream progress without buffering the archive.
  manager.CamoufoxFetcher.downloadFile = async (stream, url) => {
    await manager.webdl(url, 'Camoufox browser', false, stream, {
      progressCallback: (downloaded, total) => reportSetup('Downloading Camoufox browser', downloaded, total || null)
    });
  };
  await manager.ensureCamoufoxInstalled();
  reportSetup('Camoufox browser installed');
  console.log(JSON.stringify({ ok: true, action: 'setup', browserInstalled: true }));
}

async function status() {
  if (!fs.existsSync(path.join(packagePath, 'package.json'))) {
    console.log(JSON.stringify({ ok: true, installed: false, action: 'status' }));
    return;
  }
  const manager = await pkgman();
  let browserPath = '';
  try { browserPath = manager.camoufoxPath(); } catch {}
  console.log(JSON.stringify({ ok: true, action: 'status', launcherInstalled: true,
    browserFilesPresent: Boolean(browserPath) && fs.existsSync(browserPath) }));
}

async function stableIdentity(CamoufoxModule, profileDirectory) {
  const file = path.join(profileDirectory, '.relai-camoufox-identity.json');
  if (verifiedFile(file, 'Saved browser identity')) {
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (stored.platform !== process.platform || !stored.preset || typeof stored.preset !== 'object') {
      throw new Error('Saved fingerprint identity does not match this operating system.');
    }
    return stored.preset;
  }
  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
  const preset = CamoufoxModule.getRandomPreset(platform);
  if (!preset) throw new Error('Camoufox could not generate a browser identity for this platform.');
  try {
    fs.writeFileSync(file, JSON.stringify({ platform: process.platform, preset }), { flag: 'wx', mode: 0o600 });
    return preset;
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (stored.platform !== process.platform || !stored.preset) throw new Error('Saved fingerprint is invalid.');
    return stored.preset;
  }
}

function outputFile(value) {
  if (!value || path.isAbsolute(value)) throw new Error('Screenshot output must be a relative path inside the current workspace.');
  const root = fs.realpathSync(process.cwd());
  const absolute = path.resolve(root, value);
  const relative = path.relative(root, absolute);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep)) throw new Error('Screenshot output escapes the current workspace.');
  safeDirectory(path.dirname(absolute));
  const parent = fs.realpathSync(path.dirname(absolute));
  if (parent !== root && !parent.startsWith(root + path.sep)) throw new Error('Screenshot output resolves outside the workspace.');
  return absolute;
}

async function browse(action, flags) {
  if (!supported.includes(process.platform)) throw new Error('This platform has no supported Camoufox browser build.');
  const name = profileName(flags.profile);
  const url = targetUrl(flags.url);
  if (action !== 'open' && !url) throw new Error('--url is required for this action.');
  if (['click', 'fill'].includes(action) && (!flags.selector || flags.selector.length > 2000)) {
    throw new Error('A CSS --selector is required (maximum 2000 characters).');
  }
  if (action === 'fill' && (typeof flags.text !== 'string' || flags.text.length > 10000)) {
    throw new Error('--text is required for fill (do not send passwords or verification codes through CLI arguments).');
  }
  const CamoufoxModule = await launcher();
  const manager = await pkgman();
  let browserPath = '';
  try { browserPath = manager.camoufoxPath(); } catch {}
  if (!browserPath || !fs.existsSync(browserPath)) throw new Error('Camoufox browser is missing. Run setup --download-browser with explicit user consent.');
  const directory = safeDirectory(path.join(home, 'profiles', name));
  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
  const identity = await stableIdentity(CamoufoxModule, directory);
  const context = await CamoufoxModule.Camoufox({
    headless: false,
    os: platform,
    persistent_context: true,
    user_data_dir: directory,
    fingerprint_preset: identity
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    if (url) await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (action === 'open') {
      console.log('Camoufox is open for manual sign-in. Close the browser window to save your profile.');
      await new Promise(resolve => {
        context.once('close', resolve);
        process.once('SIGINT', () => { void context.close().catch(() => {}).finally(resolve); });
      });
      return;
    }
    if (action === 'click') await page.locator(flags.selector).click({ timeout: 15000 });
    if (action === 'fill') await page.locator(flags.selector).fill(flags.text, { timeout: 15000 });
    if (action === 'screenshot') {
      const destination = outputFile(flags.output || 'camoufox-screenshot.png');
      await page.screenshot({ path: destination, fullPage: false });
      console.log(JSON.stringify({ ok: true, action, url: page.url(), output: path.relative(process.cwd(), destination) }));
      return;
    }
    const snapshot = await page.locator('body').ariaSnapshot({ timeout: 15000 });
    console.log(JSON.stringify({ ok: true, action, url: page.url(), title: (await page.title()).slice(0, 300),
      snapshot: snapshot.slice(0, 12000), truncated: snapshot.length > 12000 }));
  } finally {
    await context.close().catch(() => {});
  }
}

try {
  const { action, flags } = options(process.argv.slice(2));
  if (action === 'help') {
    console.log('Camoufox optional extension: status | setup --download-browser | open [--url URL] [--profile ID] | snapshot --url URL | click --url URL --selector CSS | fill --url URL --selector CSS --text TEXT | screenshot --url URL [--output FILE].');
    console.log('Requires Node.js and npm. Browser profiles and dependencies are stored outside Rel.AI and project directories.');
  } else if (action === 'status') await status();
  else if (action === 'setup') await setup(flags.downloadBrowser);
  else await browse(action, flags);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
