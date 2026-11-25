# Task 2 Report: k6 WebSocket Workload and Sequence Tracker

Read this file to learn what Task 2 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/api/perf/market-data/ws-k6/tracker.mjs`: pure ESM helpers for the five workload channels, `Set-Cookie` extraction, and a per-VU frame tracker with duplicate, gap, out-of-order, invalid, server-error, heartbeat, and status counters.
- Create `apps/api/perf/market-data/ws-k6/tracker.test.mjs`: two `node:test` cases for cookie extraction and for steady-sequence tracking. Prettier reformatted the test text from the task file; the assertions are unchanged.
- Create `apps/api/perf/market-data/ws-k6/workload-ws.js`: k6 script with sign-in, authenticated WebSocket connect, subscribe, timed close, custom metrics, VU report post, and `handleSummary`.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`: Task 2 status.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/task-02-k6-ws-workload.md`: step checkboxes.
- Change `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`: Task 2 status.
- Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-02-k6-ws-workload.md`: this report.

Implementation notes that later tasks depend on:

- `tracker.onMessage` returns `{ kind: 'candle' | 'summary' | 'subscribed' | 'unsubscribed' | 'heartbeat' | 'status' | 'error' | 'invalid', isSteady }`. A steady result also carries `seq`, `duplicate`, `outOfOrder`, `backendToClientMs`, and `sourceToClientMs`.
- Steady counting starts at `seq >= 1`. Frames with `seq = 0` are valid warm-up or drain frames and never enter the steady counts.
- `tracker.snapshot` reports all five workload channels. Each channel entry has `uniqueCount`, `duplicates`, `outOfOrder`, `minSeq`, `maxSeq`, and `missingInternalSeqs` capped at 50 entries. The snapshot also reports `statusCount` next to `heartbeatCount`, so the status counter has a consumer.
- `workload-ws.js` posts a snapshot with `closeReason: 'sign-in-<status>'` when sign-in or cookie extraction fails, and the cumulative snapshot after the socket closes.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test apps/api/perf/market-data/ws-k6/tracker.test.mjs` before the implementation | 1 | `# fail 1`, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module ...tracker.mjs` |
| `node --test apps/api/perf/market-data/ws-k6/tracker.test.mjs` after the implementation | 0 | `# tests 2`, `# pass 2`, `# fail 0` |
| `pnpm exec eslint apps/api/perf/market-data/ws-k6/tracker.mjs apps/api/perf/market-data/ws-k6/tracker.test.mjs apps/api/perf/market-data/ws-k6/workload-ws.js`, first run | 1 | `109:7 error 'statusCount' is assigned a value but never used` |
| Same `pnpm exec eslint ...` command, after the snapshot included `statusCount` | 0 | No output |
| `pnpm exec prettier --check` on the same three files, first run | 1 | `[warn] apps/api/perf/market-data/ws-k6/tracker.test.mjs` |
| `pnpm exec prettier --write apps/api/perf/market-data/ws-k6/tracker.test.mjs` | 0 | `tracker.test.mjs 640ms` |
| `pnpm exec prettier --check` on the same three files, second run | 0 | `All matched files use Prettier code style!` |
| `node --check apps/api/perf/market-data/ws-k6/workload-ws.js` and `node --check apps/api/perf/market-data/ws-k6/tracker.mjs` | 0 | No output |
| `pnpm exec prettier --check` on the three changed Markdown files | 0 | `All matched files use Prettier code style!` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`. All 28 are in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`, which this task does not touch. `scripts/check-docs.mjs` skips `docs/build/**`, so no changed file is reported. |

## What the commands do not prove

- `k6` is not installed in this environment, so `workload-ws.js` never ran. `node --check` proves the file parses, not that k6 accepts the `k6/ws`, `k6/http`, or `k6/metrics` API usage.
- No sign-in, WebSocket upgrade, subscribe, or VU report reached the production API. Cookie handling under `NODE_ENV=production`, origin and TLS header acceptance, and connection limits remain unverified. Task 4 covers them.
- No load was generated. The commands prove the tracker logic on two synthetic cases, not delivery rate, latency, 100 concurrent VUs, or gap detection under a real replay stream.
- `missingInternalSeqs` is computed from the observed `minSeq` and `maxSeq` per channel, so a channel that loses its first or last steady frame has no detectable outer gap. Task 3 must compare counts across VUs to catch a missing edge frame.
- `pnpm check:docs` exits 1 on pre-existing problems in untouched `docs/knowledge/` files, so that command does not prove the whole `docs/` tree is clean.
