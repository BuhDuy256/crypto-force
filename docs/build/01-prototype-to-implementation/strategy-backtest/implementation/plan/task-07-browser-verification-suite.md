# Task 7: Browser Verification Suite and Production Build Check

Read this file to learn Task 7 steps, which add Playwright browser checks for MSW flows, UI states, build isolation, and exports.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `apps/web/playwright.market-data.config.ts` (lines 1-44)
- `apps/web/e2e/market-data/msw-smoke.spec.ts` (lines 1-63)
- `apps/web/e2e/market-data/realtime.spec.ts` (lines 1-60)
- `docs/conventions/testware.md` (lines 1-80)
- `.agents/skills/tdd/SKILL.md`

**Files:**

- Create: `apps/web/playwright.strategy-backtest.config.ts`
- Test: `apps/web/e2e/strategy-backtest/flows.spec.ts`
- Test: `apps/web/e2e/strategy-backtest/states.spec.ts`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-07-browser-verification-suite.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-07-browser-verification-suite.md`

**Interfaces:**

- Uses HTTP endpoints via Playwright browser:
  - `/api/auth/get-session` (stubbed session response in Playwright `context.route`)
  - `/api/strategies/preview`, `/api/strategies`, `/api/strategies/:id`, `/api/strategies/:id/rename`, `/api/strategies/:id/duplicate`, `/api/strategies/:id/restore`
  - `/api/backtests`, `/api/backtests/active`, `/api/backtests/:id`, `/api/backtests/:id/cancel`
- Produces:
  - `apps/web/playwright.strategy-backtest.config.ts` with two projects: `ui` (port `5185`, `VITE_API_MOCKING=false`, `serviceWorkers: 'block'`) and `msw` (port `5186`, `VITE_API_MOCKING=true`, `serviceWorkers: 'allow'`)

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Import app source (`~/`, `../app/`, `@crypto-force/web`) in any Playwright `.spec.ts` file.
- Use `waitForTimeout` or `setTimeout` sleep in any test file.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [x] **Step 1: Create `apps/web/playwright.strategy-backtest.config.ts`**

Create `apps/web/playwright.strategy-backtest.config.ts` matching `apps/web/playwright.market-data.config.ts`:

- `testDir: './e2e/strategy-backtest'`
- `outputDir: 'test-results/strategy-backtest'`
- Project `ui` runs `states.spec.ts` on `http://localhost:5185` with `VITE_API_MOCKING: 'false'` and `serviceWorkers: 'block'`.
- Project `msw` runs `flows.spec.ts` on `http://localhost:5186` with `VITE_API_MOCKING: 'true'` and `serviceWorkers: 'allow'`.
- Separate `VITE_CACHE_DIR` per port (`node_modules/.vite-strategy-backtest-${port}`).

- [x] **Step 2: Write `apps/web/e2e/strategy-backtest/flows.spec.ts`**

Create `apps/web/e2e/strategy-backtest/flows.spec.ts` with a shared `stubSession(context)` helper (matching `apps/web/e2e/market-data/msw-smoke.spec.ts`) and tests that check:

1. **Strategy Engine create, preview, draft recovery, and save handoff:**
   - Open `/strategy`, wait for service worker controller.
   - Change prompt text, reload `/strategy`, assert `Restored your unsaved changes from` banner appears, click `Discard draft`.
   - Click `Preview example rules`, assert `Go long` and `Short condition (example)` rows appear, click `Remove short example`, assert short row disappears, click `Undo` in toast, assert short row returns.
   - Enter unique strategy name `E2E_RSI_Trend`, click `Save strategy`, click `Backtest it` in toast, assert URL matches `/backtest?strategy=` and handoff note is visible.
2. **Strategy Library filter, search, rename, duplicate, delete with undo, and active nav state:**
   - Open `/library`, assert `Strategy Engine` nav link has `aria-current="page"`.
   - Filter by `Composites`, assert `MA + RSI + S/R` is visible and `RSI_BB_LB_LONG_SL2_TP4` is hidden. Reset to `All`, search `MACD`, assert `MACD_Cross_TrendFollow` is visible.
   - Open details drawer, click `Rename`, rename to `MACD_Cross_V2`, press `Enter`, assert version stays `1.2.1`.
   - Click `Duplicate`, assert drawer switches to `MACD_Cross_V2 (copy)` with version `1.0.0`.
   - Click `Delete`, submit the dialog, assert item disappears, click `Undo`, assert item returns.
3. **Backtest validation, active-run conflict, chart attribution, trades pagination, and snapshot drift:**
   - Open `/backtest`, assert exact level-1 heading `Backtest`.
   - Enter invalid `To` earlier than `From` and `Capital` `0`, assert `Fix 2 field(s) above to run the backtest.` and assert the form disables `Run backtest`.
   - Restore valid values, click `Run backtest`, assert `Running` badge and `AppHeader` chip `Backtest` are visible.
   - Click `Run backtest` a second time while running, assert `A backtest is already running` dialog opens, click `Cancel it and run the new one`, assert previous run cancels and new run starts and reaches `Completed`.
   - Assert Lightweight Charts `.tv-lightweight-charts` canvas is visible, change `Rows per page` from `10` to `25`, assert row range updates and `Previous page` stays disabled.
   - Run a backtest with `SOLUSDT` and `From` `2019-06-01`, wait for `Failed` status, assert failure reason mentions `11 Aug 2020`.
   - Open `/library`, delete `RSI_BB_LB_LONG_SL2_TP4`, return to `/backtest?run=R-1041`, assert snapshot drift note states the strategy is no longer in your library and original rules remain visible.

- [x] **Step 3: Write `apps/web/e2e/strategy-backtest/states.spec.ts`**

Create `apps/web/e2e/strategy-backtest/states.spec.ts` using deterministic `requestGate()` promises (no `waitForTimeout`) and `page.route` without MSW to check:

1. **Strategy Library loading, empty, and error + retry states:**
   - Hold `GET /api/strategies` behind a gate and assert loading skeleton renders. Release with `{ items: [], totalCount: 0 }` and assert `Your library is empty` renders.
   - Return `500` for `GET /api/strategies` and assert error alert and `Retry` button render. Switch route to `200`, click `Retry`, and assert items render.
2. **Backtest Runs loading, empty, and error + retry states:**
   - Hold `GET /api/backtests` behind a gate, open `Runs` tab, and assert skeleton renders. Release with `{ runs: [] }` and assert `No runs yet` renders.
   - Return `500` for `GET /api/backtests` and assert error alert and `Retry` button render. Switch route to `200`, click `Retry`, and assert runs list renders.
3. **Strategy Engine preview error + retry state:**
   - Return `500` for `POST /api/strategies/preview`, click `Preview example rules`, and assert error alert renders. Switch route to `200`, click `Retry`, and assert preview rules render.

- [x] **Step 4: Run Playwright verification, ESLint, production build, and export check**

Run: `pnpm --filter @crypto-force/web exec playwright test --config=playwright.strategy-backtest.config.ts && pnpm exec eslint apps/web/playwright.strategy-backtest.config.ts apps/web/e2e/strategy-backtest/flows.spec.ts apps/web/e2e/strategy-backtest/states.spec.ts && pnpm --filter @crypto-force/web build && pnpm check:exports && pnpm exec prettier --check apps/web/playwright.strategy-backtest.config.ts apps/web/e2e/strategy-backtest/flows.spec.ts apps/web/e2e/strategy-backtest/states.spec.ts`
Expected: PASS. All Playwright tests in `ui` and `msw` projects pass, ESLint exits with code 0, `react-router build` passes `reject-production-mocks`, `pnpm check:exports` reports zero unused production exports, and Prettier reports all files formatted.

- [x] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-07-browser-verification-suite.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-07-browser-verification-suite.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-07-browser-verification-suite.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-07-browser-verification-suite.md`.
5. Mark Step 5 as `- [x]`, stop, and send the report summary.
