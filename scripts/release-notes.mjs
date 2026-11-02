import { readFileSync } from 'node:fs';

const version = process.argv[2];

try {
  if (process.argv.length !== 3 || !/^\d+\.\d+\.\d+(?:-[\da-z.-]+)?(?:\+[\da-z.-]+)?$/i.test(version || '')) {
    throw new Error('Usage: node scripts/release-notes.mjs <version>');
  }

  const lines = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8').split(/\r?\n/);
  const headings = lines.flatMap((line, index) => /^## /.test(line) ? [{ line, index }] : []);
  const matches = headings.filter(({ line }) => line === `## [${version}]` || line.startsWith(`## [${version}] `));
  if (matches.length !== 1) throw new Error(`Expected one CHANGELOG section for ${version}; found ${matches.length}.`);

  const start = matches[0].index;
  const end = headings.find(({ index }) => index > start)?.index ?? lines.length;
  const body = lines.slice(start + 1, end).join('\n');
  if (!body.replace(/<!--[\s\S]*?-->/g, '').replace(/^#{1,6}\s.*$/gm, '').trim()) {
    throw new Error(`CHANGELOG section for ${version} is empty.`);
  }
  process.stdout.write(`${lines.slice(start, end).join('\n').trim()}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
