import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const directory = fileURLToPath(new URL('./', import.meta.url));
const cases = [
  [
    'stale-prime',
    'prime-cache.mjs',
    (text) => text.replace('if (now() - snapshot.dataTime >= maxAge) {', 'if (false) {'),
  ],
  [
    'unnecessary-reprime',
    'prime-cache.mjs',
    (text) => text.replace('if (now() - snapshot.dataTime >= maxAge) {', 'if (true) {'),
  ],
  [
    'no-auth-pause',
    'prepare-charts.mjs',
    (text) => text.replace('await pause(seconds * 1000);', 'await Promise.resolve();'),
  ],
  [
    'no-ready-wait',
    'prepare-charts.mjs',
    (text) => text.replace('await page.waitForFunction(', 'await Promise.resolve('),
  ],
];
for (const [name, file, change] of cases) {
  const path = `${directory}/${file}`;
  const original = readFileSync(path, 'utf8');
  try {
    const modified = change(original);
    assert.notEqual(modified, original);
    writeFileSync(path, modified);
    const result = spawnSync(process.execPath, ['--test', `${directory}/helpers.test.mjs`], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 1, `The ${name} fault did not fail the tests.`);
    assert.match(result.stdout + result.stderr, /AssertionError|ERR_ASSERTION/);
  } finally {
    writeFileSync(path, original);
  }
  assert.equal(spawnSync(process.execPath, ['--test', `${directory}/helpers.test.mjs`]).status, 0);
  console.log(JSON.stringify({ fault: name, failedAssertion: true, restored: true }));
}
