import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Each fault changes the measured component or its input, never the expected assertions.
const directory = fileURLToPath(new URL('./', import.meta.url));
const cases = [
  [
    'double-connection-time',
    'timing.mjs',
    () =>
      'export function requestDuration(timings) { return timings.blocked + timings.connecting + timings.tls_handshaking + timings.duration; }',
  ],
  [
    'object-key-order',
    'equal.mjs',
    () =>
      'export function equalValues(actual, expected) { return JSON.stringify(actual) === JSON.stringify(expected); }',
  ],
  ['always-equal', 'equal.mjs', () => 'export function equalValues() { return true; }'],
  ['empty-percentile', 'aggregate.mjs', (text) => text.replace('] : null', '] : 0')],
  [
    'rank-rounding',
    'aggregate.mjs',
    (text) =>
      text.replace('Math.ceil(quantile * sorted.length)', 'Math.floor(quantile * sorted.length)'),
  ],
  ['p95-rank', 'aggregate.mjs', (text) => text.replace("['p95', 0.95]", "['p95', 0.94]")],
  [
    'missing-key',
    'fixtures/replay.json',
    (text) => {
      const data = JSON.parse(text);
      delete data.keys['summary:SOLUSDT'];
      return JSON.stringify(data);
    },
  ],
  [
    'short-payload',
    'fixtures/replay.json',
    (text) => {
      const data = JSON.parse(text);
      data.keys['BTCUSDT:5m'].candles.pop();
      return JSON.stringify(data);
    },
  ],
  [
    'first-ma',
    'fixtures/replay.json',
    (text) => {
      const data = JSON.parse(text);
      data.keys['BTCUSDT:5m'].ma20[0].value++;
      return JSON.stringify(data);
    },
  ],
  [
    'last-ma',
    'fixtures/replay.json',
    (text) => {
      const data = JSON.parse(text);
      data.keys['BTCUSDT:5m'].ma20.at(-1).value++;
      return JSON.stringify(data);
    },
  ],
  ['missing-pairs', 'schedule.mjs', (text) => text.replace('offset % 3', '0')],
  ['unbalanced-keys', 'schedule.mjs', (text) => text.replace('Math.floor(offset / 3)', 'offset')],
];
for (const [name, file, change] of cases) {
  const path = `${directory}/${file}`;
  const original = readFileSync(path, 'utf8');
  try {
    const modified = change(original);
    assert.notEqual(modified, original, 'The fault did not change the input.');
    writeFileSync(path, modified);
    const result = spawnSync(process.execPath, [`${directory}/checks.mjs`], { encoding: 'utf8' });
    assert.equal(result.status, 1, `The ${name} fault did not fail the checks.`);
    assert.match(result.stderr, /AssertionError/);
  } finally {
    writeFileSync(path, original);
  }
  const restored = spawnSync(process.execPath, [`${directory}/checks.mjs`], { encoding: 'utf8' });
  assert.equal(restored.status, 0);
  console.log(JSON.stringify({ fault: name, failedAssertion: true, restored: true }));
}
