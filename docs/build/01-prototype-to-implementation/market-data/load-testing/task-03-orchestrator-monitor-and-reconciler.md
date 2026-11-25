# Task 3: Orchestrator, Process Monitor, and Reconciler

Read this file to learn the steps of Task 3, which extends `monitor.ps1` with an optional process label and builds the 5-run benchmark orchestrator and reconciler.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `apps/api/perf/market-data/monitor.ps1` (lines 1-9)
- `apps/api/perf/market-data/aggregate.mjs` (lines 1-19)
- `apps/api/perf/market-data/server.mjs` (lines 21-38)
- `apps/api/perf/market-data/run.mjs` (lines 22-105)
- `apps/api/src/database/schema/auth.ts` (lines 1-76)
- `apps/api/src/services/market-data-stream.service.ts` (lines 164-195)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `apps/api/perf/market-data/monitor.ps1` (lines 1-9)
- Create: `apps/api/perf/market-data/ws-k6/run.mjs`
- Test: `apps/api/perf/market-data/ws-k6/run.test.mjs`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/task-03-orchestrator-monitor-and-reconciler.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`
- Create: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-03-orchestrator-monitor-and-reconciler.md`

**Interfaces:**
- Uses:
  - `apps/api/perf/market-data/aggregate.mjs`: `percentiles(values)`
  - `apps/api/perf/market-data/ws-k6/replay-ws.mjs`: `startReplayServer`, `BENCHMARK_CHANNELS`
  - `apps/api/perf/market-data/ws-k6/workload-ws.js`: k6 workload script
  - `better-auth/crypto`: `hashPassword(password)`
  - `pg` (`Client`, `Pool`), `drizzle-orm/node-postgres` (`drizzle`), `drizzle-orm/node-postgres/migrator` (`migrate`)
- Produces in `apps/api/perf/market-data/ws-k6/run.mjs`:
  - `export function reconcileRun({ ledger, expectedVus, steadySeconds })` returning reconciliation object with `passed`, `expectedDeliveredTotal`, `actualDeliveredTotal`, `missingEventsTotal`, `duplicateEventsTotal`, `invalidEventsTotal`, `abnormalDisconnects`, `missingVuReports`, `vusWithMissingEvents`
  - `export function parseHubLogs(logLines)` returning `{ samples, maxActiveClients, maxUpstreamSubscriptions, maxFanOutRatio, eventLoopLagP95MaxMs, heapUsedMaxMb, rssMaxMb, droppedInvalidEventsMax }`
  - `export function summarizeMonitor(jsonlLines, logicalCores)` returning `{ api, k6, loadGeneratorSaturated }`
  - `export function aggregateRuns(runSummaries)` returning 5-run summary with `median`, `min`, `max` for `deliveredMessagesPerSec`, `p95LatencyMs`, `p99LatencyMs`, `errorRate`, `apiCpuPercent`, `k6CpuPercent`, `apiHeapMaxMb`
  - CLI commands: `seed`, `validate`, `benchmark`

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Change any file under `apps/api/src/`, `apps/web/`, `packages/shared/`, or `eslint.config.js`.
- Break existing `monitor.ps1` invocations that pass only `-TargetProcessId` and `-OutputPath`.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [x] **Step 1: Write the failing test**

Create `apps/api/perf/market-data/ws-k6/run.test.mjs` with this code:

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateRuns, parseHubLogs, reconcileRun, summarizeMonitor } from './run.mjs';

describe('ws-k6 run reconciler and aggregators', () => {
  it('passes reconciliation when every VU receives all ledger events with zero errors', () => {
    const ledger = {
      maxUpstreamConnections: 1,
      eventsByChannel: {
        'kline:BTCUSDT:1m': [1, 2, 3],
        'kline:BTCUSDT:5m': [1, 2, 3],
        'kline:ETHUSDT:1m': [1, 2, 3],
        'kline:SOLUSDT:1m': [1, 2, 3],
        'summary:BTCUSDT': [1, 2, 3],
      },
      totalSteadyEvents: 15,
      vuReports: [1, 2].map((vu) => ({
        vu,
        subscribedAck: true,
        closeCode: 1000,
        steadyMessages: 15,
        uniqueSteadyMessages: 15,
        duplicateMessages: 0,
        outOfOrderMessages: 0,
        invalidMessages: 0,
        serverErrorCount: 0,
        channels: {
          'kline:BTCUSDT:1m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'kline:BTCUSDT:5m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'kline:ETHUSDT:1m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'kline:SOLUSDT:1m': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
          'summary:BTCUSDT': { uniqueCount: 3, minSeq: 1, maxSeq: 3, missingInternalSeqs: [] },
        },
      })),
    };

    const result = reconcileRun({ ledger, expectedVus: 2, steadySeconds: 1.5 });
    assert.equal(result.passed, true);
    assert.equal(result.expectedDeliveredTotal, 30);
    assert.equal(result.actualDeliveredTotal, 30);
    assert.equal(result.missingEventsTotal, 0);
    assert.equal(result.duplicateEventsTotal, 0);
    assert.equal(result.invalidEventsTotal, 0);
    assert.equal(result.abnormalDisconnects, 0);
    assert.equal(result.deliveredMessagesPerSec, 20);
  });

  it('fails reconciliation on missing event, duplicate event, or abnormal close', () => {
    const ledger = {
      maxUpstreamConnections: 1,
      eventsByChannel: { 'kline:BTCUSDT:1m': [1, 2, 3] },
      totalSteadyEvents: 3,
      vuReports: [
        {
          vu: 1,
          subscribedAck: true,
          closeCode: 4008,
          steadyMessages: 3,
          uniqueSteadyMessages: 2,
          duplicateMessages: 1,
          outOfOrderMessages: 0,
          invalidMessages: 0,
          serverErrorCount: 0,
          channels: {
            'kline:BTCUSDT:1m': { uniqueCount: 2, minSeq: 1, maxSeq: 3, missingInternalSeqs: [2] },
          },
        },
      ],
    };

    const result = reconcileRun({ ledger, expectedVus: 1, steadySeconds: 1 });
    assert.equal(result.passed, false);
    assert.equal(result.missingEventsTotal, 1);
    assert.equal(result.duplicateEventsTotal, 1);
    assert.equal(result.abnormalDisconnects, 1);
    assert.equal(result.vusWithMissingEvents, 1);
  });

  it('parses Pino hub summary logs and computes monitor CPU and saturation flag', () => {
    const hub = parseHubLogs([
      JSON.stringify({ msg: 'API listening', port: 3095 }),
      JSON.stringify({
        msg: 'Market data stream hub summary.',
        activeWsClients: 100,
        upstreamSubscriptions: 5,
        fanOutRatio: 100,
        eventLoopLagP95Ms: 21.5,
        heapUsedMb: 74.2,
        rssMb: 142.8,
        droppedInvalidEvents: 0,
      }),
    ]);
    assert.equal(hub.samples.length, 1);
    assert.equal(hub.maxActiveClients, 100);
    assert.equal(hub.eventLoopLagP95MaxMs, 21.5);
    assert.equal(hub.droppedInvalidEventsMax, 0);

    const monitor = summarizeMonitor(
      [
        JSON.stringify({
          utc: '2026-11-25T07:00:00.000Z',
          process: 'api',
          cpuSeconds: 1.0,
          workingSetBytes: 100 * 1024 * 1024,
        }),
        JSON.stringify({
          utc: '2026-11-25T07:00:10.000Z',
          process: 'api',
          cpuSeconds: 2.5,
          workingSetBytes: 120 * 1024 * 1024,
        }),
        JSON.stringify({
          utc: '2026-11-25T07:00:00.000Z',
          process: 'k6',
          cpuSeconds: 0.5,
          workingSetBytes: 80 * 1024 * 1024,
        }),
        JSON.stringify({
          utc: '2026-11-25T07:00:10.000Z',
          process: 'k6',
          cpuSeconds: 2.0,
          workingSetBytes: 90 * 1024 * 1024,
        }),
      ],
      12,
    );
    assert.equal(monitor.api.avgCpuPercentOfOneCore, 15);
    assert.equal(monitor.api.maxWorkingSetMb, 120);
    assert.equal(monitor.k6.avgCpuPercentOfHost, 1.25);
    assert.equal(monitor.loadGeneratorSaturated, false);
  });

  it('aggregates five independent runs with median, min, and max', () => {
    const agg = aggregateRuns([
      {
        runId: 'r1',
        deliveredMessagesPerSec: 998,
        p95LatencyMs: 18,
        p99LatencyMs: 29,
        errorRate: 0,
        apiCpuPercent: 14,
        k6CpuPercent: 5,
        apiHeapMaxMb: 80,
      },
      {
        runId: 'r2',
        deliveredMessagesPerSec: 1000,
        p95LatencyMs: 16,
        p99LatencyMs: 25,
        errorRate: 0,
        apiCpuPercent: 15,
        k6CpuPercent: 5.5,
        apiHeapMaxMb: 82,
      },
      {
        runId: 'r3',
        deliveredMessagesPerSec: 1001,
        p95LatencyMs: 17,
        p99LatencyMs: 27,
        errorRate: 0,
        apiCpuPercent: 14.5,
        k6CpuPercent: 5.2,
        apiHeapMaxMb: 81,
      },
      {
        runId: 'r4',
        deliveredMessagesPerSec: 999,
        p95LatencyMs: 19,
        p99LatencyMs: 31,
        errorRate: 0,
        apiCpuPercent: 16,
        k6CpuPercent: 6,
        apiHeapMaxMb: 83,
      },
      {
        runId: 'r5',
        deliveredMessagesPerSec: 1000,
        p95LatencyMs: 15,
        p99LatencyMs: 24,
        errorRate: 0,
        apiCpuPercent: 13.5,
        k6CpuPercent: 4.8,
        apiHeapMaxMb: 79,
      },
    ]);
    assert.equal(agg.runCount, 5);
    assert.equal(agg.deliveredMessagesPerSec.median, 1000);
    assert.equal(agg.p95LatencyMs.median, 17);
    assert.equal(agg.p95LatencyMs.min, 15);
    assert.equal(agg.p95LatencyMs.max, 19);
  });
});
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test apps/api/perf/market-data/ws-k6/run.test.mjs`
Expected: FAIL. The output contains `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Update `apps/api/perf/market-data/monitor.ps1`**

Add an optional third parameter `[string]$ProcessName = 'k6'` in `apps/api/perf/market-data/monitor.ps1` and replace the hardcoded `'k6'` string with `$ProcessName`. Keep `-TargetProcessId` and `-OutputPath` unchanged so existing callers still work.

- [x] **Step 4: Implement `apps/api/perf/market-data/ws-k6/run.mjs`**

Implement the four exported pure functions and the three CLI modes (`seed`, `validate`, `benchmark`):
- **Database and seeding (`seed`)**:
  - Load `.env` from repository root via `process.loadEnvFile`.
  - Derive target database URL by appending `_ws_k6_perf` to the `DATABASE_URL` path.
  - Create the database if missing and apply Drizzle migrations from `apps/api/drizzle/`.
  - Hash one deterministic benchmark password with `hashPassword` from `better-auth/crypto` and upsert 100 verified users into `"user"` (`email_verified = true`) and `"account"` (`provider_id = 'credential'`).
  - Write the 100 credentials to `node_modules/.cache/market-data-ws-k6/credentials.json`.
- **Single-run execution helper (`executeRun`)**:
  - Clear `"session"` and `"rate_limit"` tables in `_ws_k6_perf`.
  - Start `replay-ws.mjs` on `127.0.0.1:3096` with `intervalMs = 500`.
  - Apply optional `faultMode` via `POST /fault` when `validate` runs fault injection.
  - Spawn untouched `node apps/api/dist/index.js` with `NODE_ENV=production`, `LOG_LEVEL=info`, `API_PORT=3095`, `BETTER_AUTH_URL=http://127.0.0.1:3095`, `BETTER_AUTH_SECRET=ws-k6-sustained-perf-local-secret-at-least-32-chars`, `RESEND_API_KEY=re_perf_dummy_unused_in_ws_load_test`, `EMAIL_FROM=Crypto Force Perf <perf@example.test>`, `DATABASE_URL=<target>`, `DATABASE_POOL_MAX=20`, `WS_MAX_CONNECTIONS_PER_USER=4`, `BINANCE_WS_URL=ws://127.0.0.1:3096/stream`.
  - Wait until `GET http://127.0.0.1:3095/api/health` returns `200`.
  - Capture API `stdout` lines into `server-metrics.jsonl` (filtering `Market data stream hub summary.` entries plus raw error lines).
  - Start two `powershell -ExecutionPolicy Bypass -File apps/api/perf/market-data/monitor.ps1` samplers writing to `host-monitor.jsonl` with `-ProcessName api` and `-ProcessName k6`.
  - Spawn `k6 run apps/api/perf/market-data/ws-k6/workload-ws.js` using `process.env.K6_PATH` or `%LOCALAPPDATA%\crypto-force-tools\k6-2.4.0\k6-v2.4.0-windows-amd64\k6.exe` (fallback `'k6'`).
  - Schedule `POST /start-steady` at `warmupSeconds` and `POST /stop-steady` at `warmupSeconds + steadySeconds`.
  - After k6 exits, fetch `GET /ledger`, stop monitors, stop API process, stop Replay server, and write `manifest.json`, `k6-summary.json`, `reconciliation.json`, `server-metrics.jsonl`, and `host-monitor.jsonl`.
- **Validation mode (`validate`)**:
  - Run one clean 10-VU smoke (`10s warmup + 15s steady + 5s drain`) and assert `reconciliation.passed === true`.
  - Run three 5-VU fault-injection checks (`drop-one`, `duplicate-one`, `invalid-payload`) and assert that each check fails reconciliation for the exact expected fault (`missingEventsTotal > 0`, `duplicateEventsTotal > 0`, and `droppedInvalidEventsMax > 0` with `missingEventsTotal > 0`).
  - Save validation output under `node_modules/.cache/market-data-ws-k6/validation-summary.json`.
- **Benchmark mode (`benchmark`)**:
  - Refuse to overwrite an existing `docs/testing/evidence/market-data/ws-k6-100vu-v1/` folder unless the caller passes `--force`.
  - Run 5 independent runs (`r1` to `r5`) at `100 VUs`, `30s warm-up + 180s steady-state + 15s drain`.
  - Write combined `docs/testing/evidence/market-data/ws-k6-100vu-v1/summary.json` including per-run metrics, 5-run `median`/`min`/`max`, load-generator saturation verdict, and cross-reference to `docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json` (`recoveryQa16AndQa17`).

- [x] **Step 5: Run tests and lint checks**

Run: `node --test apps/api/perf/market-data/ws-k6/run.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `pnpm exec eslint apps/api/perf/market-data/ws-k6/run.mjs apps/api/perf/market-data/ws-k6/run.test.mjs && pnpm exec prettier --check apps/api/perf/market-data/ws-k6/run.mjs apps/api/perf/market-data/ws-k6/run.test.mjs`
Expected: PASS. Exit code 0 with no errors.

- [x] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file.
2. Change the Task 3 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md` to `Done` and link `reports/task-03-orchestrator-monitor-and-reconciler.md`.
3. Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-03-orchestrator-monitor-and-reconciler.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Files changed.
   - Commands run, with exit codes and key output of each command.
   - What the commands do not prove.
4. Update the Task 3 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md` to `Done`.
5. Run `pnpm check:docs`.
6. Mark Step 6 as `- [x]`, stop, and send the report summary.
