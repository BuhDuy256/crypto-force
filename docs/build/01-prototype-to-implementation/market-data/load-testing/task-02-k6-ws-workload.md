# Task 2: k6 WebSocket Workload and Sequence Tracker

Read this file to learn the steps of Task 2, which builds the frame tracker and the k6 WebSocket script for 100 clients.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `apps/api/src/api/ws/market-data.ws.ts` (lines 12-63, 205-263, 307-416)
- `apps/api/src/configs/auth.ts` (lines 28-30, 159-164, 234-239)
- `apps/api/perf/market-data/workload.js` (lines 1-45)
- `eslint.config.js` (lines 146-157)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Create: `apps/api/perf/market-data/ws-k6/tracker.mjs`
- Test: `apps/api/perf/market-data/ws-k6/tracker.test.mjs`
- Create: `apps/api/perf/market-data/ws-k6/workload-ws.js`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/task-02-k6-ws-workload.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`
- Create: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-02-k6-ws-workload.md`

**Interfaces:**
- Uses from HTTP sign-in and API WebSocket protocol:
  - `POST /api/auth/sign-in/email` returning `Set-Cookie`
  - `WS /api/market-data/ws` accepting `{ type: 'subscribe', channels }` and emitting `subscribed`, `candle`, `summary`, `heartbeat`, `status`, `error`
  - `POST <REPLAY_HTTP_URL>/vu-report` accepting per-VU JSON report
- Produces in `apps/api/perf/market-data/ws-k6/tracker.mjs`:
  - `export const WORKLOAD_CHANNELS` (same 5 channels: `BTCUSDT:1m`, `BTCUSDT:5m`, `ETHUSDT:1m`, `SOLUSDT:1m`, `summary:BTCUSDT`)
  - `export function extractCookieHeader(setCookieHeader)` returning a `Cookie` header string or `null`
  - `export function createVuTracker(vu)` returning `{ onMessage(rawText, recvAtMs), snapshot(closeCode, closeReason) }`
- Produces in `apps/api/perf/market-data/ws-k6/workload-ws.js`:
  - k6 script configured by env vars `CREDENTIALS_PATH`, `API_ORIGIN`, `WS_URL`, `REPLAY_HTTP_URL`, `SUMMARY_PATH`, `VUS`, `WARMUP_SECONDS`, `STEADY_SECONDS`, `DRAIN_SECONDS`

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

- [x] **Step 1: Write the failing test**

Create `apps/api/perf/market-data/ws-k6/tracker.test.mjs` with this code:

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createVuTracker, extractCookieHeader, WORKLOAD_CHANNELS } from './tracker.mjs';

describe('tracker helper', () => {
  it('extracts Secure session cookies from string and array Set-Cookie headers', () => {
    assert.equal(WORKLOAD_CHANNELS.length, 5);
    assert.equal(
      extractCookieHeader('__Secure-better-auth.session_token=abc.123; Path=/; HttpOnly; Secure'),
      '__Secure-better-auth.session_token=abc.123',
    );
    assert.equal(
      extractCookieHeader([
        '__Secure-better-auth.session_token=abc.123; Path=/; Secure',
        'other=val; Path=/',
      ]),
      '__Secure-better-auth.session_token=abc.123; other=val',
    );
    assert.equal(extractCookieHeader(undefined), null);
  });

  it('tracks steady sequences, ignores warmup seq 0, and detects duplicates, gaps, and invalid frames', () => {
    const tracker = createVuTracker(4);

    assert.equal(
      tracker.onMessage(
        JSON.stringify({ type: 'subscribed', channels: WORKLOAD_CHANNELS }),
        1000,
      ).kind,
      'subscribed',
    );

    const warmup = tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000,
          volume: 0,
          isClosed: false,
        },
        dataTime: 1000,
        sourceTime: 998,
      }),
      1005,
    );
    assert.equal(warmup.isSteady, false);

    const seq1 = tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000.01,
          volume: 1,
          isClosed: false,
        },
        dataTime: 2000,
        sourceTime: 1995,
      }),
      2012,
    );
    assert.equal(seq1.isSteady, true);
    assert.equal(seq1.backendToClientMs, 12);
    assert.equal(seq1.sourceToClientMs, 17);

    // Duplicate seq 1
    tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000.01,
          volume: 1,
          isClosed: false,
        },
        dataTime: 2020,
        sourceTime: 2015,
      }),
      2025,
    );

    // Skip seq 2, send seq 3
    tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000.03,
          volume: 3,
          isClosed: false,
        },
        dataTime: 3000,
        sourceTime: 2995,
      }),
      3010,
    );

    // Summary seq 1
    const summary1 = tracker.onMessage(
      JSON.stringify({
        type: 'summary',
        summary: {
          pair: 'BTCUSDT',
          lastPrice: 60000.01,
          change24hPercent: 1.25,
          dataTime: 3000,
        },
        sourceTime: 2996,
      }),
      3008,
    );
    assert.equal(summary1.isSteady, true);
    assert.equal(summary1.seq, 1);

    // Invalid JSON and malformed candle
    assert.equal(tracker.onMessage('not-json', 3010).kind, 'invalid');
    assert.equal(
      tracker.onMessage(JSON.stringify({ type: 'candle', pair: 'BTCUSDT' }), 3011).kind,
      'invalid',
    );

    const report = tracker.snapshot(1000, '');
    assert.equal(report.vu, 4);
    assert.equal(report.subscribedAck, true);
    assert.equal(report.steadyMessages, 4);
    assert.equal(report.duplicateMessages, 1);
    assert.equal(report.invalidMessages, 2);
    assert.equal(report.channels['kline:BTCUSDT:1m'].uniqueCount, 2);
    assert.deepEqual(report.channels['kline:BTCUSDT:1m'].missingInternalSeqs, [2]);
    assert.equal(report.channels['summary:BTCUSDT'].uniqueCount, 1);
  });
});
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test apps/api/perf/market-data/ws-k6/tracker.test.mjs`
Expected: FAIL. The output contains `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Implement `apps/api/perf/market-data/ws-k6/tracker.mjs`**

Implement pure ES module helpers with zero Node-only imports so k6 can import `tracker.mjs` directly:
- `WORKLOAD_CHANNELS`: exact 5 channel objects matching `wsClientMessageSchema` (`{ kind: 'kline', pair: 'BTCUSDT', timeframe: '1m' }`, `{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }`, `{ kind: 'kline', pair: 'ETHUSDT', timeframe: '1m' }`, `{ kind: 'kline', pair: 'SOLUSDT', timeframe: '1m' }`, `{ kind: 'summary', pair: 'BTCUSDT' }`).
- `extractCookieHeader(setCookieHeader)`: accept string or array of strings. Extract each `name=value` pair before the first `;`. Return joined `a=1; b=2` string or `null` when empty.
- `createVuTracker(vu)`:
  - Check every incoming JSON frame strictly:
    - `subscribed`: check `Array.isArray(msg.channels) && msg.channels.length === 5`. Set `subscribedAck = true`.
    - `heartbeat` and `status`: count separately (`heartbeatCount`, `statusCount`). Do not treat as steady data messages.
    - `error`: increment `serverErrorCount`.
    - `candle`: require valid `pair`, `timeframe`, integer `dataTime`, object `candle` with positive OHLC, `low <= open,close <= high`, non-negative integer `volume`, boolean `isClosed`. Read `seq = Math.round(msg.candle.volume)`.
    - `summary`: require valid `summary.pair`, positive `summary.lastPrice`, finite `summary.change24hPercent`, integer `summary.dataTime`. Read `seq = Math.round((msg.summary.lastPrice - 60000) * 100)`.
    - For `candle` and `summary` with `seq >= 1`: increment `steadyMessages`, compute `backendToClientMs = Math.max(0, recvAtMs - dataTime)` and `sourceToClientMs = sourceTime !== undefined ? Math.max(0, recvAtMs - sourceTime) : null`, update per-channel `seen` set, `duplicates`, `outOfOrder`, `minSeq`, `maxSeq`.
    - Any parse error or failed field check increments `invalidMessages` and returns `{ kind: 'invalid' }`.
  - `snapshot(closeCode, closeReason)`: compute internal gaps (`missingInternalSeqs`, capped to first 50 entries for payload size) and return `{ vu, subscribedAck, closeCode, closeReason, steadyMessages, uniqueSteadyMessages, duplicateMessages, outOfOrderMessages, invalidMessages, serverErrorCount, heartbeatCount, channels }`.

- [x] **Step 4: Implement `apps/api/perf/market-data/ws-k6/workload-ws.js`**

Write `apps/api/perf/market-data/ws-k6/workload-ws.js` using `k6/ws`, `k6/http`, `k6/metrics`, `k6`, and `./tracker.mjs`:
- Configure `options.scenarios.sustained` with `executor: 'per-vu-iterations'`, `vus: Number(__ENV.VUS || 100)`, `iterations: 1`, `maxDuration: `${totalSeconds + 30}s``.
- Define k6 custom metrics with low-cardinality tags only:
  - `ws_delivery_latency_ms = new Trend('ws_delivery_latency_ms', true)`
  - `ws_source_to_client_ms = new Trend('ws_source_to_client_ms', true)`
  - `ws_steady_messages = new Counter('ws_steady_messages')`
  - `ws_invalid_messages = new Counter('ws_invalid_messages')`
  - `ws_duplicate_messages = new Counter('ws_duplicate_messages')`
  - `ws_server_errors = new Counter('ws_server_errors')`
  - `ws_auth_errors = new Counter('ws_auth_errors')`
  - `ws_abnormal_disconnects = new Counter('ws_abnormal_disconnects')`
  - `ws_error_rate = new Rate('ws_error_rate')`
- In the default VU function:
  1. Read `credentials = JSON.parse(open(__ENV.CREDENTIALS_PATH))` in init context.
  2. Stagger sign-in by `((__VU - 1) % 20) * 0.25` seconds.
  3. Send `POST ${API_ORIGIN}/api/auth/sign-in/email` with `Origin: API_ORIGIN`, `X-Forwarded-Proto: https`, and `x-forwarded-for: 10.82.0.${__VU}`.
  4. Extract cookie with `extractCookieHeader(res.headers['Set-Cookie'])`. If sign-in fails or cookie is `null`, increment `ws_auth_errors`, add `true` to `ws_error_rate`, post a failed VU report to `${REPLAY_HTTP_URL}/vu-report`, and return.
  5. Open `ws.connect(WS_URL, { headers: { Cookie: cookie, Origin: API_ORIGIN, 'X-Forwarded-Proto': 'https' } }, (socket) => { ... })`.
  6. On `open`, send `{ type: 'subscribe', channels: WORKLOAD_CHANNELS }`.
  7. Schedule `socket.setTimeout` for `(totalSeconds - staggerSec) * 1000` ms to close cleanly with `socket.close(1000)`.
  8. On `message`, pass `(raw, Date.now())` to `tracker.onMessage`. Record metrics for steady messages, duplicates, invalid messages, and server errors.
  9. On `close`, capture close code (record `ws_abnormal_disconnects` if code is not `1000`) and post `tracker.snapshot(closeCode, closeReason)` to `${REPLAY_HTTP_URL}/vu-report`.
- Export `handleSummary(data)` returning `{ [__ENV.SUMMARY_PATH]: JSON.stringify(data, null, 2) }`.

- [x] **Step 5: Run tests and lint checks**

Run: `node --test apps/api/perf/market-data/ws-k6/tracker.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `pnpm exec eslint apps/api/perf/market-data/ws-k6/tracker.mjs apps/api/perf/market-data/ws-k6/tracker.test.mjs apps/api/perf/market-data/ws-k6/workload-ws.js && pnpm exec prettier --check apps/api/perf/market-data/ws-k6/tracker.mjs apps/api/perf/market-data/ws-k6/tracker.test.mjs apps/api/perf/market-data/ws-k6/workload-ws.js`
Expected: PASS. Exit code 0 with no errors.

- [x] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file.
2. Change the Task 2 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md` to `Done` and link `reports/task-02-k6-ws-workload.md`.
3. Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-02-k6-ws-workload.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Files changed.
   - Commands run, with exit codes and key output of each command.
   - What the commands do not prove.
4. Update the Task 2 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md` to `Done`.
5. Run `pnpm check:docs`.
6. Mark Step 6 as `- [x]`, stop, and send the report summary.
