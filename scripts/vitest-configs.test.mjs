// Each workspace package that runs Vitest must set expect.requireAssertions, so that a test with
// no assertion fails (docs/conventions/testware.md). Vitest does not read a root
// setting for each package, so a new package needs its own config. Run with `pnpm check:rules`.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = join(import.meta.dirname, '..');
const configNames = [
  'vitest.config.ts',
  'vitest.config.mts',
  'vitest.config.js',
  'vitest.config.mjs',
];

/** Groups of workspace packages: the `<group>/*` globs in pnpm-workspace.yaml. */
const groups = [
  ...readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8').matchAll(
    /^\s*-\s*'?([\w-]+)\/\*'?\s*$/gm,
  ),
].map((match) => match[1] ?? '');

test('pnpm-workspace.yaml lists its packages as <group>/* globs', () => {
  assert.ok(groups.length > 0, 'Read no "<group>/*" glob: update the parser in this file.');
});

const packages = groups.flatMap((group) =>
  readdirSync(join(root, group), { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(join(root, group, entry.name, 'package.json')),
    )
    .map((entry) => `${group}/${entry.name}`),
);

/** @param {string} folder */
function runsVitest(folder) {
  const manifest = JSON.parse(readFileSync(join(root, folder, 'package.json'), 'utf8'));
  return Object.values(manifest.scripts ?? {}).some((script) => /\bvitest\b/.test(String(script)));
}

test('the workspace has packages that run Vitest', () => {
  assert.ok(packages.filter(runsVitest).length > 0, 'No package runs Vitest: check the globs.');
});

for (const folder of packages.filter(runsVitest)) {
  test(`${folder} fails a test that has no assertion`, () => {
    const name = configNames.find((file) => existsSync(join(root, folder, file)));
    assert.ok(
      name,
      `${folder} runs Vitest but has no vitest.config.ts. Add one with test: { expect: { requireAssertions: true } }, as in packages/shared/vitest.config.ts.`,
    );
    const config = readFileSync(join(root, folder, name), 'utf8');
    assert.match(
      config,
      /requireAssertions:\s*true/,
      `${folder}/${name} does not set requireAssertions. Add test: { expect: { requireAssertions: true } }, as in packages/shared/vitest.config.ts.`,
    );
  });
}
