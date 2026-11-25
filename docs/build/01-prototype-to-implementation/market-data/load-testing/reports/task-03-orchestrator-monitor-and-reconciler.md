# Task 3 Report: Orchestrator, Process Monitor, and Reconciler

Read this file to learn what Task 3 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Change `apps/api/perf/market-data/monitor.ps1`: added an optional `[string]$ProcessName = 'k6'` parameter and replaced the hardcoded `'k6'` label with `$ProcessName`. Calls that pass only `-TargetProcessId` and `-OutputPath` behave as before.
- Create `apps/api/perf/market-data/ws-k6/run.mjs`: pure helpers `reconcileRun`, `parseHubLogs`, `summarizeMonitor`, and `aggregateRuns`, plus the `seed`, `validate`, and `benchmark` CLI modes.
- Create `apps/api/perf/market-data/ws-k6/run.test.mjs`: four `node:test` cases for reconciliation, hub log parsing, monitor summarization, and five-run aggregation.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`: Task 3 status.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/task-03-orchestrator-monitor-and-reconciler.md`: step checkboxes.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`: Task 3 status.
- Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-03-orchestrator-monitor-and-reconciler.md`: this report.

Implementation notes that Task 4 depends on:

- `seed` creates `<POSTGRES_DB>_ws_k6_perf`, applies `apps/api/drizzle/`, and upserts 100 users whose `email` is `ws-k6-<nnn>@example.test` with one `credential` account each. Credentials go to `node_modules/.cache/market-data-ws-k6/credentials.json` as `[{ email, password }]`.
- `executeRun` deletes `"session"` and `"rate_limit"` before each run, starts the replay server in-process on `127.0.0.1:3096` with `intervalMs = 500`, spawns `node apps/api/dist/index.js` on `127.0.0.1:3095`, and starts two `monitor.ps1` samplers.
- The two samplers write separate files under `<run>/.sampling/` and the orchestrator merges them into `<run>/host-monitor.jsonl` sorted by `utc`. `monitor.ps1` appends with `[System.IO.File]::AppendAllText`, which denies a second concurrent writer, so two samplers cannot append to one file safely. The merged file keeps the `process` field (`api` or `k6`).
- k6 runs with `--summary-trend-stats avg,min,med,max,p(90),p(95),p(99)` because the k6 default summary omits `p(99)`; `run.mjs` reads `p(95)` and `p(99)` from `k6-summary.json`.
- `executeRun` fails when it captures no `Market data stream hub summary.` line or no host monitor sample for either process, so zero CPU or heap values cannot enter the evidence files.
- `executeRun` returns `runSummary` with `reconciliationPassed` and `loadGeneratorSaturated`. `benchmark` writes `runCount`, `runs`, and `aggregate` at the top level, matching the checks in Task 4.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test apps/api/perf/market-data/ws-k6/run.test.mjs` before the implementation | 1 | `# fail 1`, `ERR_MODULE_NOT_FOUND` for `run.mjs` |
| `node --test apps/api/perf/market-data/ws-k6/run.test.mjs` after the implementation | 0 | `# tests 4`, `# pass 4`, `# fail 0` |
| `pnpm exec eslint apps/api/perf/market-data/ws-k6/run.mjs apps/api/perf/market-data/ws-k6/run.test.mjs` | 0 | No output |
| `pnpm exec prettier --check` on both files, first run | 1 | `[warn] apps/api/perf/market-data/ws-k6/run.mjs` |
| `pnpm exec prettier --write` on `run.mjs`, then `--check` on both files | 0 | `All matched files use Prettier code style!` |
| `node apps/api/perf/market-data/ws-k6/run.mjs` without a command | 1 | `Usage: node apps/api/perf/market-data/ws-k6/run.mjs <seed\|validate\|benchmark>` |
| `node apps/api/perf/market-data/ws-k6/run.mjs seed` | 0 | `database: crypto_force_ws_k6_perf`, `users: 100`, `credentialAccounts: 100` |
| `node apps/api/perf/market-data/ws-k6/run.mjs validate`, first attempt | 1 | `The API did not become healthy on 127.0.0.1:3095.` after the 30-second wait |
| `node apps/api/perf/market-data/ws-k6/run.mjs validate`, retry after adding API log capture to the timeout error | 0 | `allChecksPassed: true`; clean smoke `passed: true` with 0 missing, 0 duplicate, 0 invalid, 0 abnormal |
| `node apps/api/perf/market-data/ws-k6/run.mjs validate`, final run after adding `--summary-trend-stats` and raising the health allowance to 60 seconds | 0 | `drop-one`: `missingEventsTotal: 5`; `duplicate-one`: `duplicateEventsTotal: 5`; `invalid-payload`: `droppedInvalidEventsMax: 1`, `missingEventsTotal: 5`; all four checks passed |
| `node apps/api/perf/market-data/ws-k6/run.mjs validate`, final run after adding the missing-sample guards | 0 | `allChecksPassed: true`; the clean smoke reports 1450 expected and 1450 actual delivered events |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`, all in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`; no message mentions `load-testing` |

Extra observations from the final `validate` smoke (10 VUs, 15-second steady state):

- `k6-summary.json` records `ws_delivery_latency_ms` with `p(95) = 9` and `p(99) = 16` after the trend-stats flag.
- `server-metrics.jsonl` contains three `Market data stream hub summary.` lines with `activeWsClients: 10`, `upstreamSubscriptions: 5`, `droppedInvalidEvents: 0`, and `heapUsedMb` up to 39.66.
- `host-monitor.jsonl` contains 30 samples for `process: "api"` and 30 for `process: "k6"`. `summarizeMonitor` reports `api.avgCpuPercentOfOneCore: 13.36`, `k6.avgCpuPercentOfHost: 0.41`, and `loadGeneratorSaturated: false`.
- `reconciliation.json` for the clean smoke reports `expectedDeliveredTotal: 1450`, `actualDeliveredTotal: 1450`, and `deliveredMessagesPerSec: 96.67`.

`seed` and `validate` were run in addition to the checks in Step 5 to prove the orchestration path. Task 4 repeats both commands.

## What the commands do not prove

- No 100-VU run and no five-run benchmark executed. The benchmark evidence directory was not created, so the overwrite guard, the `--force` path, and the combined `summary.json` shape remain unexecuted.
- The four unit tests cover only pure functions with synthetic input. They do not prove that a real API, replay server, k6 process, or PostgreSQL instance produces the same shapes.
- The validation runs use 10 VUs for the clean smoke and 5 VUs for fault injection, with a 15-second steady state. They prove that the reconciler detects each injected fault, not that 100 authenticated clients sustain load or that the host is unsaturated at 100 VUs.
- The fault checks run on one Windows host with loopback HTTP. `X-Forwarded-Proto: https` is a header, not real TLS termination, and the host shares CPU and RAM with API, k6, replay, and Docker Desktop PostgreSQL.
- The optional `-ProcessName` label has no dedicated test. It is exercised only indirectly because `host-monitor.jsonl` from `validate` contains `process: "api"` and `process: "k6"`.
- `pnpm check:docs` exits 1 on 28 pre-existing problems in untouched `docs/knowledge/` files, so it does not prove that the whole `docs/` tree is clean. It reports nothing for `docs/build/**`, which it skips, so the changed files in this task are not checked by that command.
