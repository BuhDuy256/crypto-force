// Fails when production code exports a value or a type that no production module imports
// (docs/development/coding-guidelines.md#testware). Such an export is often there only for a test,
// and the test then checks the structure of the module instead of its behavior. Uses knip in
// production mode, which does not count imports from tests. Configuration: knip.jsonc.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

// knip is a devDependency of the workspace root, so pnpm links it into the root node_modules.
const knip = join(import.meta.dirname, '..', 'node_modules', 'knip', 'bin', 'knip.js');
const result = spawnSync(
  process.execPath,
  [knip, '--production', '--include', 'exports,types', '--no-progress'],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error(
    [
      '',
      'Each export above has no importer in production code. Remove the `export` keyword, or delete',
      'the code if nothing uses it. If a test imports it, test the behavior through the public',
      'function of the module instead, with the expected value from the test case, e.g.',
      "expect(getSafeNext('//evil.example')).toBe('/realtime'). If the export is a public API of a",
      'vendored package, add its folder to "ignore" in knip.jsonc with the reason.',
      'See docs/development/coding-guidelines.md#testware.',
    ].join('\n'),
  );
  process.exit(result.status ?? 1);
}
