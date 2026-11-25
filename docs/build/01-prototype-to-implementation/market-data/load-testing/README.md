# Market Data WebSocket k6 Load Testing Plan

Read this file to learn the goal, decisions, global constraints, and task order for the sustained WebSocket load benchmark.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Produce reproducible sustained WebSocket load evidence across 100 authenticated clients over five 180-second runs with k6 on the untouched production API build and PostgreSQL.

**Approach:** Add three isolated benchmark scripts under `apps/api/perf/market-data/ws-k6/` and one optional label parameter in `apps/api/perf/market-data/monitor.ps1`. Run `node apps/api/dist/index.js` with `BINANCE_WS_URL` pointed at a local deterministic replay server. Reuse existing recovery evidence in `docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json` for reconnection and REST backfill.

**Tech stack:** Node.js `>=22.22` (ESM), `k6` (`k6/ws`, `k6/http`), `ws`, `pg`, `drizzle-orm`, `better-auth/crypto`, PowerShell process monitor, PostgreSQL via Docker Compose.

**Spec:** Approved minimal scope in conversation (100 VUs, 5 runs, 30s warm-up + 180s steady-state + 15s drain, 2 events/s/channel, zero production code changes).

## Decisions

| Topic | Decision |
| --- | --- |
| Harness path | Place all new scripts in `apps/api/perf/market-data/ws-k6/`. This path resolves `apps/api` packages and avoids changes to `package.json` or `eslint.config.js`. |
| k6 script file name | Name the k6 script `workload-ws.js`. `eslint.config.js` already grants k6 globals (`__ENV`, `__VU`, `__ITER`, `open`, `console`) to `apps/api/perf/**/workload*.js`. |
| SUT binary | Run `node apps/api/dist/index.js` directly with `NODE_ENV=production` and `LOG_LEVEL=info`. Do not change files in `apps/api/src/`. |
| Ports | Use `127.0.0.1:3095` for the API and `127.0.0.1:3096` for the replay WebSocket and collector server. These ports stay separate from dev (`3000`), E2E (`3001`), and REST perf (`5195`, `3025`, `3026`). |
| Database | Create a dedicated PostgreSQL database named `<POSTGRES_DB>_ws_k6_perf`. Apply real Drizzle migrations from `apps/api/drizzle/`. Seed 100 verified users with `better-auth/crypto` `hashPassword`. Delete rows from `session` and `rate_limit` before each run. |
| Auth and TLS in production mode | Set `BETTER_AUTH_URL=http://127.0.0.1:3095` and dummy `RESEND_API_KEY` and `EMAIL_FROM` values. Each VU sends `Origin: http://127.0.0.1:3095`, `X-Forwarded-Proto: https`, and `x-forwarded-for: 10.82.0.<vu>`. Each VU reads `Set-Cookie` from sign-in and passes it in the WebSocket `Cookie` header. |
| Workload | Run 100 VUs for 5 independent runs. Each run lasts 225 seconds: 30 seconds warm-up, 180 seconds steady-state, and 15 seconds drain. Each VU subscribes to 4 kline channels (`BTCUSDT:1m`, `BTCUSDT:5m`, `ETHUSDT:1m`, `SOLUSDT:1m`) and 1 summary channel (`BTCUSDT`). |
| Replay rate and sequence encoding | Emit 2 events/s per channel (10 incoming events/s total, 1,000 expected delivered messages/s at 100 VUs). Emit `seq = 0` during warm-up and drain. Emit `seq = 1..N` during steady-state. Encode `seq` in `candle.volume` for kline frames and in `summary.lastPrice = 60000 + seq * 0.01` for summary frames. This encoding stays valid under `wsServerMessageSchema` `z.strictObject`. |
| Latency definitions | Measure `ws_delivery_latency_ms = recvAt - dataTime` (backend to client) as the primary metric. Also record `ws_source_to_client_ms = recvAt - sourceTime` for cross-checks. Exclude heartbeats and status frames from delivered data throughput. |
| Browser probe | Do not run Chromium in this benchmark. Keep browser paint latency separate from k6 WebSocket delivery latency. |
| Recovery evidence | Reuse `recoveryQa16AndQa17` in `docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json` (16 outage samples, 30s to 300s, p95 1388.96 ms, 0 missing/duplicate/mismatch). Do not cite zero loss during steady load as proof of recovery. |
| Evidence storage | Save compact artifacts under `docs/testing/evidence/market-data/ws-k6-100vu-v1/`: `summary.json` and `r1/` to `r5/` (`manifest.json`, `k6-summary.json`, `reconciliation.json`, `server-metrics.jsonl`, `host-monitor.jsonl`). Do not commit raw per-message `raw-k6.jsonl`. |
| CV bullet target | `Engineered a real-time WebSocket market-data service with shared subscriptions, automatic reconnection, and REST backfill for missed candles; load-tested with k6, sustaining X messages/s across 100 authenticated clients at Y ms p95 latency over five 180-second runs.` Fill `X` and `Y` from measured `summary.json` only. |

## Global Constraints

- Operating system: Windows. Run commands from the repository root (`C:\Users\Duy\Desktop\crypto-force`) in PowerShell or Git Bash.
- Runtime and package manager: Node.js `>=22.22` (ESM) and `pnpm` 9.
- Production code boundary: Do not change any file in `apps/api/src/`, `apps/web/`, `packages/shared/`, `packages/engine/`, or `eslint.config.js`.
- Existing benchmark boundary: Do not change `apps/api/perf/market-data/ws-benchmark.mjs`, `server.mjs`, `run.mjs`, or `workload.js`. Only add an optional `-ProcessName` parameter with default `'k6'` to `apps/api/perf/market-data/monitor.ps1`.
- Verification scope: Run scoped ESLint (`pnpm exec eslint <changed-files>`), `node --test <test-files>`, Prettier check (`pnpm exec prettier --check <changed-files>`), and `pnpm check:docs` for edited docs. Do not run `pnpm check` unless the user asks for it.
- No rule bypass: Do not add `eslint-disable`, `@ts-expect-error`, or warning comments (`todo`, `fixme`, `hack`, `xxx`).
- No git side effects: Do not commit or push changes.
- Evidence integrity: Never fabricate or estimate benchmark numbers. Report exact measured values and flag any saturation or anomaly.
- Report language: Write task reports in English using short, active sentences.

## Review Focus

- **Sequence loss at steady boundaries:** Check that warm-up and drain frames (`seq = 0`) never inflate steady counts and that each VU catches a dropped steady frame. Covered by [Task 1](task-01-replay-server-and-collector.md) and [Task 2](task-02-k6-ws-workload.md).
- **Schema validity under `wsServerMessageSchema`:** Check that every replay frame matches the strict Zod schema (`openTime` alignment, OHLC bounds, positive prices). Covered by [Task 1](task-01-replay-server-and-collector.md).
- **Production `Secure` cookie and TLS header handling:** Check that k6 extracts `__Secure-` cookies from `Set-Cookie` and passes `X-Forwarded-Proto: https` and `Origin` on `NODE_ENV=production`. Covered by [Task 2](task-02-k6-ws-workload.md) and [Task 4](task-04-fault-injection-and-five-run-execution.md).
- **Silent reconciliation failure:** Check with fault injection (`drop-one`, `duplicate-one`, `invalid-payload`) that the reconciler fails on missing, duplicate, or invalid data. Covered by [Task 3](task-03-orchestrator-monitor-and-reconciler.md) and [Task 4](task-04-fault-injection-and-five-run-execution.md).
- **Load generator saturation:** Check that `host-monitor.jsonl` records API and k6 CPU and RAM every second. `summary.json` flags saturation when k6 CPU exceeds 80 percent of host capacity. Covered by [Task 3](task-03-orchestrator-monitor-and-reconciler.md) and [Task 4](task-04-fault-injection-and-five-run-execution.md).

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Pending | [Replay Server and VU Collector](task-01-replay-server-and-collector.md) |
| 2 | Pending | [k6 WebSocket Workload and Sequence Tracker](task-02-k6-ws-workload.md) |
| 3 | Pending | [Orchestrator, Process Monitor, and Reconciler](task-03-orchestrator-monitor-and-reconciler.md) |
| 4 | Pending | [Fault-Injection Validation and Five-Run Execution](task-04-fault-injection-and-five-run-execution.md) |
