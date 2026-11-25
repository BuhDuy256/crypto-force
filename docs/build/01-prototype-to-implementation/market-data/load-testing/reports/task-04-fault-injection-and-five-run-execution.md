# Task 4 Report: Fault-Injection Validation and Five-Run Execution

Read this file to learn which commands produced the 100-VU WebSocket evidence, what the five runs measured, and what that evidence does not prove.

## Files created and changed

- Create `docs/testing/evidence/market-data/ws-k6-100vu-v1/summary.json`: five-run aggregate, environment, and recovery cross-reference.
- Create `docs/testing/evidence/market-data/ws-k6-100vu-v1/r1/` to `r5/`: `manifest.json`, `k6-summary.json`, `reconciliation.json`, `server-metrics.jsonl`, `host-monitor.jsonl` per run.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/task-04-fault-injection-and-five-run-execution.md`: step checkboxes.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`: Task 4 status.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`: Task 4 status.
- Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-04-fault-injection-and-five-run-execution.md`: this report.

No file under `apps/api/src/`, `apps/web/`, `packages/shared/`, or `eslint.config.js` changed. `git status --short` before the benchmark showed a clean tree and listed no edits under `apps/api/src/`.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm --filter @crypto-force/api build` | 0 | `ESM dist\index.js 111.65 KB`, `Build success in 173ms` |
| `docker compose ps postgres` | 0 | `crypto-force-postgres-1`, `Up 5 hours (healthy)`, `0.0.0.0:5432->5432/tcp` |
| `node -e "…console.log({ k6Path: p, exists: fs.existsSync(p) })"` | 0 | `exists: true` for `k6-v2.4.0-windows-amd64/k6.exe` |
| `Get-NetTCPConnection -LocalPort 3095,3096` | 0 | No connection; both ports free |
| `node apps/api/perf/market-data/ws-k6/run.mjs seed` | 0 | `database: crypto_force_ws_k6_perf`, `users: 100`, `credentialAccounts: 100` |
| `node apps/api/perf/market-data/ws-k6/run.mjs validate` | 0 | `allChecksPassed: true`; clean smoke passed with 0 missing, 0 duplicate, 0 invalid, 0 abnormal |
| `node apps/api/perf/market-data/ws-k6/run.mjs benchmark` | 0 | `runCount: 5`, `allRunsPassed: true`, `loadGeneratorSaturated: false`; wall time from `2026-11-25T08:49:37.669Z` to `2026-11-25T09:10:22.110Z` (20 min 45 s) |
| Step 5 `node -e` inspection of `summary.json` | 0 | `runCount: 5`, `allPassed: true`, `anyLoadGenSaturated: false` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`, all in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`; no message mentions `load-testing`, and the script skips `docs/build/**` |

Fault-injection detail from `node_modules/.cache/market-data-ws-k6/validation-summary.json`:

| Check | Check passed | Reconciliation passed | Missing | Duplicate | Dropped invalid (max) |
| --- | --- | --- | --- | --- | --- |
| `clean-smoke` (10 VU) | true | true | 0 | 0 | 0 |
| `drop-one` (5 VU) | true | false | 5 | 0 | 0 |
| `duplicate-one` (5 VU) | true | false | 0 | 5 | 0 |
| `invalid-payload` (5 VU) | true | false | 5 | 0 | 1 |

Each fault check reports `passed: true` because the reconciler failed the run as required. The clean smoke reports `passed: true` because the reconciler accepted the run.

## Measured results

Parameters: 100 VUs, 30 s warm-up, 180 s steady state, 15 s drain, 2 events/s per channel, 1,000 expected delivered messages/s. Host: `DESKTOP-KE0DR9U`, `13th Gen Intel(R) Core(TM) i7-1355U`, 12 logical cores, 16,857,645,056 bytes RAM, Windows `10.0.26300`. Node `v22.23.5`, k6 `2.4.0`.

| Run | Delivered msg/s | p95 ms | p99 ms | Error rate | API CPU % | k6 CPU % | API heap max MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| r1 | 983.33 | 18 | 49 | 0 | 28.31 | 2.61 | 62.04 |
| r2 | 983.33 | 14 | 30 | 0 | 28.15 | 2.57 | 48.92 |
| r3 | 980.56 | 22 | 65 | 0 | 27.61 | 2.64 | 46.02 |
| r4 | 986.11 | 19 | 67 | 0 | 27.15 | 2.75 | 56.38 |
| r5 | 986.11 | 18 | 49 | 0 | 29.80 | 2.99 | 63.36 |
| Median | 983.33 | 18 | 49 | 0 | 28.15 | 2.64 | 56.38 |
| Min | 980.56 | 14 | 30 | 0 | 27.15 | 2.57 | 46.02 |
| Max | 986.11 | 22 | 67 | 0 | 29.80 | 2.99 | 63.36 |

All five runs reconciled exactly. Each `reconciliation.json` reports `expectedVus: 100`, `vuReports: 100`, `missingVuReports: 0`, `expectedDeliveredTotal: 176500`, `actualDeliveredTotal: 176500`, 0 missing, 0 duplicate, 0 invalid, 0 abnormal disconnects, 0 missing subscribed acks, and `maxUpstreamConnections: 1`. Every run exits k6 with code 0.

`apiEventLoopLagP95MaxMs` stays between 63.963 ms (r2) and 103.088 ms (r3). Memory holds flat: `apiRssMaxMb` stays between 122.53 MB (r2) and 131.43 MB (r5), so no leak shows across five runs.

## Load-generator saturation check

- k6 CPU: median 2.64 percent of host capacity, max 2.99 percent. The 80 percent saturation threshold is far above the measurement.
- k6 RAM: max 157.91 MB (`r4`), against 16.09 GiB host RAM and 145.48 to 157.91 MB across runs.
- API CPU: median 28.15 percent of host capacity, max 29.80 percent.
- API RSS: max 131.43 MB (`r5`), heap max 63.36 MB.
- `loadGeneratorSaturated` is `false` in all five runs, and `summary.json` reports `loadGeneratorSaturated: false`.

The load generator is not the bottleneck. k6 uses about one tenth of the CPU that the API uses at 100 VUs.

## CV bullet

> Engineered a real-time WebSocket market-data service with shared subscriptions, automatic reconnection, and REST backfill for missed candles; load-tested with k6, sustaining 983 messages/s across 100 authenticated clients at 18 ms p95 latency over five 180-second runs.

The numbers come from the measured median in `summary.json` (`deliveredMessagesPerSec.median = 983.33`, `p95LatencyMs.median = 18`). All five runs passed reconciliation with no saturation.

## Recovery evidence

Reconnection and REST backfill stay out of this benchmark. `summary.json` reuses `recoveryQa16AndQa17` from `docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json`: 16 outage samples from 30 s to 300 s, recovery p50 870.94 ms, p95 1388.96 ms, p99 1388.96 ms, and `allSamplesZeroMissingDuplicateMismatch: true` with `qa16Passed` and `qa17Passed` both true.

Steady-state zero loss does not prove recovery behavior. The recovery claim cites the 16-sample evidence, not these five runs.

## What the commands do not prove

- Single-host topology. API, k6, replay server, PowerShell sampler, and Docker Desktop PostgreSQL share one Windows laptop. No network hop, container limit, or separate load-generator host is tested.
- TLS termination. Each VU sends `X-Forwarded-Proto: https` and a matching `Origin` header. No reverse proxy, certificate, or live TLS handshake exists, so TLS overhead is absent from the latency numbers.
- Capacity limit. The workload uses a fixed 100-VU baseline, not a breaking point. The measured headroom (API CPU under 30 percent, k6 CPU under 3 percent) suggests spare capacity but does not measure where it ends.
- Replay fidelity. Market data comes from a local deterministic replay server, not Binance. Real Binance frame sizes, burst patterns, and upstream disconnects are not exercised.
- Data durability. Rows are written through the real production build into `crypto_force_ws_k6_perf`, but nothing asserts long-term persistence, backup, or migration behavior.
- `pnpm check:docs` exits 1 on 28 pre-existing problems in untouched `docs/knowledge/` files, so it does not prove that the whole `docs/` tree is clean. It reports nothing for `docs/build/**`, which it skips, so the changed files in this task are not checked by that command.
