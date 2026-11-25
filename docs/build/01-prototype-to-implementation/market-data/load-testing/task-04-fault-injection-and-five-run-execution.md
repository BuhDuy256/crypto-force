# Task 4: Fault-Injection Validation and Five-Run Execution

Read this file to learn the steps of Task 4, which runs fault injection, five 100-VU benchmarks, and evidence checks.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `apps/api/perf/market-data/ws-k6/run.mjs` (lines 1-120)
- `docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json` (lines 552-575)
- `.agents/skills/verification-before-completion/SKILL.md`

**Files:**
- Create: `docs/testing/evidence/market-data/ws-k6-100vu-v1/summary.json`
- Create: `docs/testing/evidence/market-data/ws-k6-100vu-v1/r1/*` through `r5/*`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/task-04-fault-injection-and-five-run-execution.md`
- Change: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md`
- Create: `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-04-fault-injection-and-five-run-execution.md`

**Interfaces:**
- Uses:
  - `node apps/api/perf/market-data/ws-k6/run.mjs seed`
  - `node apps/api/perf/market-data/ws-k6/run.mjs validate`
  - `node apps/api/perf/market-data/ws-k6/run.mjs benchmark`
- Produces:
  - Verified evidence directory `docs/testing/evidence/market-data/ws-k6-100vu-v1/` containing `summary.json` and `r1/` to `r5/` (`manifest.json`, `k6-summary.json`, `reconciliation.json`, `server-metrics.jsonl`, `host-monitor.jsonl`)

**STOP when:**
- The output of a command does not match `Expected`.
- Docker PostgreSQL or `k6` is unavailable on the host.
- `pnpm dev` or another server holds port `3095` or `3096`.
- Fault-injection checks fail to detect `drop-one`, `duplicate-one`, or `invalid-payload`.
- Any file under `apps/api/src/` contains uncommitted edits before running `benchmark`.
- The same step fails two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Change any file under `apps/api/src/`, `apps/web/`, `packages/shared/`, or `eslint.config.js`.
- Edit generated evidence JSON or JSONL files by hand.
- Commit `raw-k6.jsonl` or `node_modules/.cache/` files.
- Fabricate, smooth, or drop any of the five benchmark runs.
- Commit or push.

- [x] **Step 1: Check host prerequisites and fresh production API build**

Run: `pnpm --filter @crypto-force/api build && docker compose ps postgres`
Expected: PASS. `apps/api/dist/index.js` builds with exit code 0 and `postgres` status shows `Up` or `healthy`.

Run: `node -e "const fs=require('fs'); const p=process.env.K6_PATH || (process.env.LOCALAPPDATA + '/crypto-force-tools/k6-2.4.0/k6-v2.4.0-windows-amd64/k6.exe'); console.log({ k6Path: p, exists: fs.existsSync(p) });"`
Expected: PASS. `exists` is `true` (or `k6 version` exits 0 when `k6` is on `PATH`). If neither exists, stop and report the missing binary.

- [x] **Step 2: Seed the dedicated benchmark database**

Run: `node apps/api/perf/market-data/ws-k6/run.mjs seed`
Expected: PASS. Exit code 0. Output shows 100 verified users in `_ws_k6_perf` and credentials in `node_modules/.cache/market-data-ws-k6/credentials.json`.

- [x] **Step 3: Run smoke check and fault-injection checks**

Run: `node apps/api/perf/market-data/ws-k6/run.mjs validate`
Expected: PASS. Exit code 0. Output shows:
- Clean 10-VU smoke: `passed: true`, `missingEventsTotal: 0`, `duplicateEventsTotal: 0`, `invalidEventsTotal: 0`, `abnormalDisconnects: 0`.
- `drop-one`: `passed: false`, `missingEventsTotal > 0`.
- `duplicate-one`: `passed: false`, `duplicateEventsTotal > 0`.
- `invalid-payload`: `passed: false`, `droppedInvalidEventsMax > 0`.

- [x] **Step 4: Run five independent 100-VU sustained benchmarks**

Run: `node apps/api/perf/market-data/ws-k6/run.mjs benchmark`
Expected: PASS. Exit code 0 after approximately 20 to 22 minutes. Creates `docs/testing/evidence/market-data/ws-k6-100vu-v1/summary.json` and subdirectories `r1` through `r5`.

- [x] **Step 5: Inspect measured results and check evidence completeness**

Run: `node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('docs/testing/evidence/market-data/ws-k6-100vu-v1/summary.json','utf8')); console.log(JSON.stringify({ runCount: s.runCount, allPassed: s.runs.every(r=>r.reconciliationPassed), anyLoadGenSaturated: s.runs.some(r=>r.loadGeneratorSaturated), deliveredMessagesPerSec: s.aggregate.deliveredMessagesPerSec, p95LatencyMs: s.aggregate.p95LatencyMs, p99LatencyMs: s.aggregate.p99LatencyMs, errorRate: s.aggregate.errorRate, apiCpuPercent: s.aggregate.apiCpuPercent, k6CpuPercent: s.aggregate.k6CpuPercent, apiHeapMaxMb: s.aggregate.apiHeapMaxMb }, null, 2));"`
Expected: PASS. `runCount` equals `5`. All five runs contain complete metrics. If `allPassed` is `false` or `anyLoadGenSaturated` is `true`, keep all evidence files untouched and report the exact failure or saturation numbers without hiding them.

- [x] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file.
2. Change the Task 4 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/README.md` to `Done` and link `reports/task-04-fault-injection-and-five-run-execution.md`.
3. Create `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/task-04-fault-injection-and-five-run-execution.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Files created and changed.
   - Commands run, with exit codes and key output of each command.
   - Summary table of all 5 runs (`r1` to `r5`) plus median, min, and max values.
   - Load-generator saturation check (`k6` CPU and RAM vs API CPU and RAM).
   - Filled CV bullet using exact measured median values (only if all 5 runs passed without saturation).
   - Cross-reference to recovery evidence in `docs/testing/evidence/market-data/ws-v1-benchmarks/summary.json`.
   - What the commands do not prove (single-host Windows topology, `X-Forwarded-Proto: https` instead of live TLS termination, fixed 100-VU baseline rather than capacity breaking point).
4. Update the Task 4 row in `docs/build/01-prototype-to-implementation/market-data/load-testing/reports/README.md` to `Done`.
5. Run `pnpm check:docs`.
6. Mark Step 6 as `- [x]`, stop, and send the report summary.
