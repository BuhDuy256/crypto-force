# Task 1 Report: Replay Server and VU Collector

Read this file to learn what Task 1 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/api/perf/market-data/ws-k6/replay-ws.mjs`: deterministic Binance combined-stream replay server with five benchmark channels, steady-state sequence ledger, three fault modes, VU report collector, and CLI entry point.
- Create `apps/api/perf/market-data/ws-k6/replay-ws.test.mjs`: three `node:test` cases for channel definitions and frame validity, the steady flow with ledger and VU report, and the `duplicate-one` fault mode.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`: Task 1 status.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/task-01-replay-server-and-collector.md`: step checkboxes.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`: Task 1 status.
- Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-01-replay-server-and-collector.md`: this report.

Implementation notes that later tasks depend on:

- The ledger records one sequence number per benchmark channel per steady tick, not one record per socket. A run with 100 VUs therefore keeps the same expected count as a run with one VU.
- The fault trigger fires once per steady window, on `steadySeq === 1`, and only for `kline:BTCUSDT:1m`. `drop-one` records the sequence number and skips the frame. `duplicate-one` sends the frame twice. `invalid-payload` sends a kline frame whose high is below open and close, which `candleSchema` rejects in `wsServerMessageSchema`.
- `POST /start-steady` resets the phase, `steadySeq`, the ledger, `steadyStartMs`, and the fault trigger. `POST /stop-steady` moves the phase to `drain` and records `steadyEndMs`.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test apps/api/perf/market-data/ws-k6/replay-ws.test.mjs` before the implementation | 1 | `# fail 1`, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module ...replay-ws.mjs` |
| `node --test apps/api/perf/market-data/ws-k6/replay-ws.test.mjs` after the implementation | 0 | `# tests 3`, `# pass 3`, `# fail 0`, `ok 1 - replay-ws server` |
| `pnpm exec eslint apps/api/perf/market-data/ws-k6/replay-ws.mjs apps/api/perf/market-data/ws-k6/replay-ws.test.mjs` | 0 | No output |
| `pnpm exec prettier --check apps/api/perf/market-data/ws-k6/replay-ws.mjs apps/api/perf/market-data/ws-k6/replay-ws.test.mjs` | 0 | `All matched files use Prettier code style!` |
| `node apps/api/perf/market-data/ws-k6/replay-ws.mjs --port 3196 --interval-ms 100` then `GET http://127.0.0.1:3196/ledger` (manual smoke check, process stopped after the request) | 0 | `{"ready":true,"port":3196,"wsUrl":"ws://127.0.0.1:3196/stream","httpUrl":"http://127.0.0.1:3196"}`; ledger with `"totalSteadyEvents":0`, five empty channel arrays, `"vuReports":[]` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`. All 28 are in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`, which this task does not touch. None of the changed files is reported: `docs/build/**` is skipped by `scripts/check-docs.mjs`. |

## What the commands do not prove

- The test asserts only the `duplicate-one` fault mode. `drop-one` and `invalid-payload` are implemented but have no automated assertion in this task.
- No frame passes through the production API. The claim that `invalid-payload` frames are dropped, and that the API hub forwards valid frames, is not proven here. Task 3 and Task 4 cover it.
- No load was generated. The commands run one WebSocket client for under a second, so they do not prove delivery rate, latency, 100 concurrent VUs, or ledger behavior under load.
- The CLI smoke check started the server and served one HTTP request. It did not exercise `SIGINT` or `SIGTERM` shutdown, so clean signal handling and port release remain unverified.
- `pnpm check:docs` exits 1 on pre-existing problems in untouched `docs/knowledge/` files, so that command does not prove the whole `docs/` tree is clean.
