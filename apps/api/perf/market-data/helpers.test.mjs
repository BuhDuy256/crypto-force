import assert from 'node:assert/strict';
import { test } from 'node:test';
import { primeCache } from './prime-cache.mjs';
import { prepareCharts } from './prepare-charts.mjs';

// Tests setup only, with explicit clocks and a Page boundary model. No real waits.
// Faults: omitted expiry preparation, unnecessary reprime, omitted retry pause, and omitted readiness wait.
test('replaces a prime near expiry before measuring a hit', async () => {
  let time = 4500;
  let calls = 0;
  const waits = [];
  let result;
  await assert.doesNotReject(async () => {
    result = await primeCache({
      prime: async () => ({ dataTime: calls++ === 0 ? 0 : 10500 }),
      now: () => time,
      pause: async (ms) => {
        waits.push(ms);
        time += ms;
      },
      ttlMs: 5000,
      thinkMs: 6000,
      record: () => {},
    });
  });
  assert.deepEqual(result, { dataTime: 10500 });
  assert.deepEqual(waits, [6000]);
});

test('uses a fresh prime without an extra wait', async () => {
  let calls = 0;
  const waits = [];
  const result = await primeCache({
    prime: async () => {
      calls++;
      return { dataTime: 0 };
    },
    now: () => 1000,
    pause: async (ms) => {
      waits.push(ms);
    },
    ttlMs: 5000,
    thinkMs: 6000,
    record: () => {},
  });
  assert.deepEqual(result, { dataTime: 0 });
  assert.equal(calls, 1);
  assert.deepEqual(waits, []);
});

test('waits for the Auth retry header before preparing four charts', async () => {
  const waits = [];
  const records = [];
  let applied = 0;
  let reloaded = false;
  const page = {
    async waitForFunction() {
      if (reloaded) applied = 4;
    },
    async evaluate() {
      return reloaded ? null : { status: 429, retryAfter: '2' };
    },
    async reload() {
      reloaded = true;
    },
  };
  await prepareCharts(
    page,
    (record) => records.push(record),
    async (ms) => {
      waits.push(ms);
    },
  );
  assert.equal(applied, 4);
  assert.deepEqual(waits, [2000]);
  assert.equal(records.length, 1);
});

test('waits for four charts when Auth does not limit setup', async () => {
  let applied = 0;
  const page = {
    async waitForFunction() {
      applied = 4;
    },
    async evaluate() {
      return null;
    },
    async reload() {
      throw new Error('The fresh setup must not reload.');
    },
  };
  await prepareCharts(page, () => {
    throw new Error('The fresh setup must not record a limit.');
  });
  assert.equal(applied, 4);
});
