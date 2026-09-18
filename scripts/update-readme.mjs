import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

const START = '<!-- catalog:extensions:start -->';
const END = '<!-- catalog:extensions:end -->';

function readCatalog(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
}

function renderTable(catalog) {
  const entries = [...catalog.extensions].sort((left, right) => left.name.localeCompare(right.name));
  const lines = [
    START,
    '| Extension | Type | Version | Managed install | Description |',
    '| --- | --- | --- | --- | --- |'
  ];

  for (const entry of entries) {
    const name = `[${escapeCell(entry.name)}](${entry.repository})`;
    const kind = `\`${escapeCell(entry.kind)}\``;
    const version = `\`${escapeCell(entry.version)}\``;
    const managed = entry.autoInstall === true ? 'Yes' : 'No';
    lines.push(`| ${name} | ${kind} | ${version} | ${managed} | ${escapeCell(entry.description)} |`);
  }

  lines.push(END);
  return lines.join('\n');
}

function escapeCell(value) {
  return String(value || '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function updateReadme(root, checkOnly = false) {
  const readmePath = path.join(root, 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);

  if (start < 0 || end < start) {
    throw new Error('README.md does not contain the catalog extension markers.');
  }

  const rendered = renderTable(readCatalog(root));
  const current = readme.slice(start, end + END.length);

  if (checkOnly) {
    if (current !== rendered) {
      throw new Error('README.md extension list is out of date. Run npm run readme:update.');
    }
    console.log('README extension list is current.');
    return;
  }

  const next = `${readme.slice(0, start)}${rendered}${readme.slice(end + END.length)}`;
  fs.writeFileSync(readmePath, next);
  console.log('Updated README extension list.');
}

const root = process.cwd();
updateReadme(root, process.argv.includes('--check'));
