import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { percentiles } from './aggregate.mjs';
import { burstKeys } from './schedule.mjs';
import { equalValues } from './equal.mjs';
import { requestDuration } from './timing.mjs';

// Checks measurement arithmetic against literal values from the approved nearest-rank definition.
assert.deepEqual(percentiles([]), { p50: null, p95: null, p99: null });
assert.deepEqual(percentiles([4, 1, 3, 2]), { p50: 2, p95: 4, p99: 4 });
assert.deepEqual(percentiles(Array.from({ length: 100 }, (_, index) => index + 1)), {
  p50: 50,
  p95: 95,
  p99: 99,
});
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/replay.json', import.meta.url), 'utf8'),
);
assert.equal(Object.keys(fixture.keys).length, 21);
assert.equal(fixture.keys['BTCUSDT:5m'].candles.length, 519);
assert.deepEqual(fixture.keys['BTCUSDT:5m'].ma20[0], { time: 1735695300, value: 10099 });
assert.deepEqual(fixture.keys['BTCUSDT:5m'].ma20.at(-1), { time: 1735845000, value: 15089 });
const histogram = {};
for (let offset = 0; offset < 18; offset++) {
  const { pair, frames } = burstKeys(offset, true);
  for (const frame of frames)
    histogram[`${pair}:${frame}`] = (histogram[`${pair}:${frame}`] || 0) + 1;
}
assert.equal(Object.keys(histogram).length, 18);
assert.deepEqual(Object.values(histogram), Array(18).fill(4));
assert.equal(
  equalValues({ a: 1, nested: [{ b: 2, a: 3 }] }, { nested: [{ a: 3, b: 2 }], a: 1 }),
  true,
);
assert.equal(equalValues({ close: 4 }, { close: 5 }), false);
assert.equal(equalValues([1, 2], [2, 1]), false);
assert.equal(requestDuration({ blocked: 3, connecting: 2, tls_handshaking: 1, duration: 10 }), 13);
console.log('Thirteen measurement checks passed.');
