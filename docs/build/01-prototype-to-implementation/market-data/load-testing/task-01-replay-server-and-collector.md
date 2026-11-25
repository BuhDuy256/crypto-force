# Task 1: Replay Server and VU Collector

Read this file to learn the steps of Task 1, which builds the deterministic Binance combined-stream replay server and per-VU report collector.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `apps/api/src/providers/market-data/binance-stream.provider.ts` (lines 19-69)
- `packages/shared/src/schemas/market-data.schema.ts` (lines 1-165)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Create: `apps/api/perf/market-data/ws-k6/replay-ws.mjs`
- Test: `apps/api/perf/market-data/ws-k6/replay-ws.test.mjs`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/task-01-replay-server-and-collector.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`
- Create: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-01-replay-server-and-collector.md`

**Interfaces:**
- Uses: `ws` (`WebSocketServer`), `node:http` (`createServer`), `node:events` (`once`)
- Produces in `apps/api/perf/market-data/ws-k6/replay-ws.mjs`:
  - `export const BENCHMARK_CHANNELS` (array of 5 objects: `BTCUSDT:1m`, `BTCUSDT:5m`, `ETHUSDT:1m`, `SOLUSDT:1m` kline channels and `BTCUSDT` summary channel)
  - `export function channelToStreamName(channel)` returning Binance stream name (`btcusdt@kline_1m`, `btcusdt@ticker`, etc.)
  - `export function buildUpstreamFrame({ channel, seq, openTimeMs, isClosed, nowMs, invalidPayload })` returning `{ stream, data }`
  - `export async function startReplayServer({ host = '127.0.0.1', port = 3096, intervalMs = 500 } = {})` returning `{ port, wsUrl, httpUrl, close }`

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Change any file under `apps/api/src/`, `apps/web/`, `packages/shared/`, or `eslint.config.js`.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [ ] **Step 1: Write the failing test**

Create `apps/api/perf/market-data/ws-k6/replay-ws.test.mjs` with this code:

```js
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { describe, it } from 'node:test';
import { WebSocket } from 'ws';
import {
  BENCHMARK_CHANNELS,
  buildUpstreamFrame,
  channelToStreamName,
  startReplayServer,
} from './replay-ws.mjs';

describe('replay-ws server', () => {
  it('defines 4 kline channels and 1 summary channel with valid deterministic payloads', () => {
    assert.equal(BENCHMARK_CHANNELS.length, 5);
    assert.equal(channelToStreamName(BENCHMARK_CHANNELS[0]), 'btcusdt@kline_1m');
    assert.equal(channelToStreamName(BENCHMARK_CHANNELS[4]), 'btcusdt@ticker');

    const klineFrame = buildUpstreamFrame({
      channel: BENCHMARK_CHANNELS[0],
      seq: 7,
      openTimeMs: 1735689600000,
      isClosed: false,
      nowMs: 1735689600500,
      invalidPayload: false,
    });
    assert.equal(klineFrame.stream, 'btcusdt@kline_1m');
    assert.equal(klineFrame.data.e, 'kline');
    assert.equal(klineFrame.data.E, 1735689600500);
    assert.equal(klineFrame.data.k.v, '7');
    assert.equal(klineFrame.data.k.t % 60_000, 0);
    assert.ok(Number(klineFrame.data.k.h) >= Number(klineFrame.data.k.c));
    assert.ok(Number(klineFrame.data.k.l) <= Number(klineFrame.data.k.c));

    const summaryFrame = buildUpstreamFrame({
      channel: BENCHMARK_CHANNELS[4],
      seq: 7,
      openTimeMs: 1735689600000,
      isClosed: false,
      nowMs: 1735689600500,
      invalidPayload: false,
    });
    assert.equal(summaryFrame.stream, 'btcusdt@ticker');
    assert.equal(summaryFrame.data.e, '24hrTicker');
    assert.equal(summaryFrame.data.c, '60000.07');
  });

  it('acknowledges SUBSCRIBE, emits steady frames with ledger counts, and stores VU reports', async () => {
    const server = await startReplayServer({ port: 0, intervalMs: 40 });
    try {
      const ws = new WebSocket(server.wsUrl);
      await once(ws, 'open');

      const received = [];
      ws.on('message', (raw) => {
        received.push(JSON.parse(raw.toString()));
      });

      const params = BENCHMARK_CHANNELS.map(channelToStreamName);
      ws.send(JSON.stringify({ method: 'SUBSCRIBE', params, id: 1 }));
      await new Promise((resolve) => setTimeout(resolve, 60));

      const ack = received.find((msg) => msg.id === 1);
      assert.deepEqual(ack, { id: 1, result: null });

      const startRes = await fetch(`${server.httpUrl}/start-steady`, { method: 'POST' });
      assert.equal(startRes.status, 200);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const stopRes = await fetch(`${server.httpUrl}/stop-steady`, { method: 'POST' });
      assert.equal(stopRes.status, 200);

      const reportRes = await fetch(`${server.httpUrl}/vu-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vu: 1, subscribedAck: true, closeCode: 1000, channels: {} }),
      });
      assert.equal(reportRes.status, 200);

      const ledger = await (await fetch(`${server.httpUrl}/ledger`)).json();
      assert.equal(ledger.maxUpstreamConnections, 1);
      assert.ok(ledger.totalSteadyEvents >= 10);
      assert.equal(ledger.vuReports.length, 1);
      assert.equal(ledger.vuReports[0].vu, 1);

      const steadyKlines = received.filter(
        (msg) => msg.stream === 'btcusdt@kline_1m' && Number(msg.data?.k?.v) >= 1,
      );
      assert.ok(steadyKlines.length >= 2);
      assert.equal(Number(steadyKlines[0].data.k.v), 1);

      ws.close(1000);
      await once(ws, 'close');
    } finally {
      await server.close();
    }
  });

  it('supports drop-one, duplicate-one, and invalid-payload fault modes', async () => {
    const server = await startReplayServer({ port: 0, intervalMs: 30 });
    try {
      const ws = new WebSocket(server.wsUrl);
      await once(ws, 'open');
      const received = [];
      ws.on('message', (raw) => received.push(JSON.parse(raw.toString())));
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: ['btcusdt@kline_1m'],
          id: 1,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 40));

      const faultRes = await fetch(`${server.httpUrl}/fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'duplicate-one' }),
      });
      assert.equal(faultRes.status, 200);

      await fetch(`${server.httpUrl}/start-steady`, { method: 'POST' });
      await new Promise((resolve) => setTimeout(resolve, 110));
      await fetch(`${server.httpUrl}/stop-steady`, { method: 'POST' });

      const seqs = received
        .filter((msg) => msg.stream === 'btcusdt@kline_1m' && Number(msg.data?.k?.v) >= 1)
        .map((msg) => Number(msg.data.k.v));
      const seq1Count = seqs.filter((value) => value === 1).length;
      assert.equal(seq1Count, 2);

      ws.close(1000);
      await once(ws, 'close');
    } finally {
      await server.close();
    }
  });
});
```

- [ ] **Step 2: Run the test and make sure that it fails**

Run: `node --test apps/api/perf/market-data/ws-k6/replay-ws.test.mjs`
Expected: FAIL. The output contains `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement `apps/api/perf/market-data/ws-k6/replay-ws.mjs`**

Implement these exact exports and behaviors:
- `BENCHMARK_CHANNELS`:
  1. `{ kind: 'kline', pair: 'BTCUSDT', timeframe: '1m', key: 'kline:BTCUSDT:1m', intervalMs: 60_000 }`
  2. `{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m', key: 'kline:BTCUSDT:5m', intervalMs: 300_000 }`
  3. `{ kind: 'kline', pair: 'ETHUSDT', timeframe: '1m', key: 'kline:ETHUSDT:1m', intervalMs: 60_000 }`
  4. `{ kind: 'kline', pair: 'SOLUSDT', timeframe: '1m', key: 'kline:SOLUSDT:1m', intervalMs: 60_000 }`
  5. `{ kind: 'summary', pair: 'BTCUSDT', key: 'summary:BTCUSDT', intervalMs: 0 }`
- `channelToStreamName(channel)`: return `${pair.toLowerCase()}@kline_${timeframe}` for `kline` and `${pair.toLowerCase()}@ticker` for `summary`.
- `buildUpstreamFrame({ channel, seq, openTimeMs, isClosed, nowMs, invalidPayload })`:
  - For `kline`: return `{ stream, data: { e: 'kline', E: nowMs, s: pair, k: { t: openTimeMs, i: timeframe, o: '50000.00', h: invalidPayload ? '49000.00' : '50100.00', l: '49990.00', c: (50000 + (seq % 100) * 0.01).toFixed(2), v: String(seq), x: isClosed } } }`.
  - For `summary`: return `{ stream, data: { e: '24hrTicker', E: nowMs, s: pair, c: invalidPayload ? '-1.00' : (60000 + seq * 0.01).toFixed(2), P: '1.25' } }`.
- `startReplayServer({ host = '127.0.0.1', port = 3096, intervalMs = 500 } = {})`:
  - Start one HTTP server and attach a `WebSocketServer({ noServer: true })` for path `/stream`.
  - Track active upstream sockets, `maxUpstreamConnections`, and subscribed stream names per socket.
  - On `SUBSCRIBE` or `UNSUBSCRIBE`, update the socket subscription set and reply `{ id, result: null }`.
  - Run one `setInterval` at `intervalMs`.
  - When phase is `warmup` or `drain`, emit `seq = 0` for subscribed channels.
  - When phase is `steady`, increment `steadySeq` by `1` on each tick (`1, 2, 3...`), set `isClosed = steadySeq % 120 === 0`, advance `openTimeMs` after a closed candle, record the emitted `seq` in `eventsByChannel[channel.key]`, and emit frames to every subscribed socket.
  - Fault injection on `steadySeq === 1` for `kline:BTCUSDT:1m` only (triggered once per steady window):
    - `drop-one`: record `seq = 1` in the ledger, do not send the WebSocket frame for `kline:BTCUSDT:1m`.
    - `duplicate-one`: send the frame for `kline:BTCUSDT:1m` twice.
    - `invalid-payload`: send a frame with `invalidPayload: true` (high below open/close, which the API hub drops as invalid).
  - Serve HTTP endpoints on the same server:
    - `POST /start-steady`: switch phase to `steady`, reset `steadySeq = 0`, reset `eventsByChannel`, record `steadyStartMs = Date.now()`, return `200`.
    - `POST /stop-steady`: switch phase to `drain`, record `steadyEndMs = Date.now()`, return `200`.
    - `POST /fault`: accept `{ mode: null | 'drop-one' | 'duplicate-one' | 'invalid-payload' }`, reject unknown values with `400`, return `200`.
    - `POST /vu-report`: append parsed JSON body to `vuReports`, return `200`.
    - `GET /ledger`: return JSON with `upstreamConnections`, `maxUpstreamConnections`, `subscribedStreams`, `steadyStartMs`, `steadyEndMs`, `eventsByChannel`, `totalSteadyEvents`, `vuReports`, and `faultMode`.
  - Support direct CLI execution when `process.argv[1]` ends with `replay-ws.mjs` (reads `--port` and `--interval-ms`, prints `{ ready: true, port, wsUrl, httpUrl }`, stops cleanly on `SIGINT`/`SIGTERM`).

- [ ] **Step 4: Run the tests and lint checks**

Run: `node --test apps/api/perf/market-data/ws-k6/replay-ws.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `pnpm exec eslint apps/api/perf/market-data/ws-k6/replay-ws.mjs apps/api/perf/market-data/ws-k6/replay-ws.test.mjs && pnpm exec prettier --check apps/api/perf/market-data/ws-k6/replay-ws.mjs apps/api/perf/market-data/ws-k6/replay-ws.test.mjs`
Expected: PASS. Exit code 0 with no errors.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. Change the Task 1 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md` to `Done` and link `reports/task-01-replay-server-and-collector.md`.
3. Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-01-replay-server-and-collector.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Files changed.
   - Commands run, with exit codes and key output of each command.
   - What the commands do not prove.
4. Update the Task 1 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md` to `Done`.
5. Run `pnpm check:docs`.
6. Mark Step 5 as `- [x]`, stop, and send the report summary.
