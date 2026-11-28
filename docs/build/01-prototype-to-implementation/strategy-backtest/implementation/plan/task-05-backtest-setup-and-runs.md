# Task 5: Backtest Setup, Active Run Lifecycle, Conflict Dialog, and Runs Views

Read this file to learn Task 5 steps, which build the Backtest setup form, run status card, conflict dialog, and Runs views.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `apps/web/app/routes/backtest.tsx` (lines 1-10)
- `apps/web/e2e/auth/fixtures.ts` (lines 290-305)
- `apps/web/app/hooks/useBacktests.ts` (lines 1-120)
- `apps/web/app/hooks/useStrategies.ts` (lines 1-140)
- `apps/web/app/utils/strategy-draft.ts` (lines 1-120)
- `docs/design/prototype/docs/requirements/backtest.md` (lines 1-120)
- `docs/design/prototype/screens/Backtest.dc.html` (lines 60-145, 275-290)
- `.agents/skills/tdd/SKILL.md`

**Files:**

- Create: `apps/web/app/pages/Backtest/BacktestPage.tsx`
- Create: `apps/web/app/pages/Backtest/components/BacktestSetupForm.tsx`
- Create: `apps/web/app/pages/Backtest/components/RunStatusCard.tsx`
- Create: `apps/web/app/pages/Backtest/components/ActiveRunConflictDialog.tsx`
- Create: `apps/web/app/pages/Backtest/components/RunsListView.tsx`
- Create: `apps/web/app/pages/Backtest/components/RunDetailView.tsx`
- Change: `apps/web/app/routes/backtest.tsx` (lines 1-10)
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-05-backtest-setup-and-runs.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-05-backtest-setup-and-runs.md`

**Interfaces:**

- Uses from `@crypto-force/shared`:
  - `createBacktestInputSchema`, `marketPairSchema`, `backtestTimeframeSchema`
  - Types: `BacktestRun`, `BacktestRunDetail`, `CreateBacktestInput`, `StrategyLibraryItem`
- Uses from `apps/web/app/hooks/useBacktests.ts`:
  - `useBacktestRuns`, `useActiveBacktest`, `useBacktestRunDetail`, `useCreateBacktest`, `useCancelBacktest`
- Uses from `apps/web/app/hooks/useStrategies.ts`:
  - `useStrategyList`
- Uses from `apps/web/app/utils/strategy-draft.ts`:
  - `formatBacktestPeriod`, `isDateAfterToday`
- Produces in `apps/web/app/pages/Backtest/BacktestPage.tsx`:
  - `export function BacktestPage(): React.JSX.Element`

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Change the level-1 heading text away from exact `Backtest` (existing auth E2E tests assert exact `Backtest`).
- Import `useEffect` or `useLayoutEffect` in any file under `apps/web/app/pages/`.
- Import `~/api/` in any file under `apps/web/app/pages/`.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [x] **Step 1: Create `BacktestSetupForm.tsx`, `RunStatusCard.tsx`, and `ActiveRunConflictDialog.tsx`**

Create `apps/web/app/pages/Backtest/components/BacktestSetupForm.tsx` using `react-hook-form` + `@hookform/resolvers/zod`:

- Default values: `pair: 'BTCUSDT'`, `timeframe: '5m'`, `from: '2025-05-01'`, `to: '2025-05-15'`, `capitalUsd: 100`, `strategyName: 'MA Crossover'`, `strategyId: null`, `feePercent: 0.08`, `slippageBps: 5`.
- Fields:
  - `Pair`: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`
  - `Timeframe`: `1m`, `5m`, `15m`, `1h`, `4h`
  - `From` and `To`: date inputs (`type="date"`). Check required fields, `to > from`, and `!isDateAfterToday(to, todayIsoDate)` with message `End date cannot be in the future.`
  - `Capital (USD)`: numeric input, minimum `1` (`Enter at least 1 USD.`)
  - `Strategy`: built-in `MA Crossover`, every item from `useStrategyList()`, plus an optional `{name} (unsaved)` option when a deleted or unsaved strategy arrives from handoff or rerun.
  - `Fee (%)`: numeric input `0` to `1` (`Use 0 to 1%.`)
  - `Slippage (bps)`: integer numeric input `0` to `100` (`Whole number, 0 to 100.`)
- Show inline error message under each invalid field with `aria-invalid="true"`.
- Show summary alert `Fix {errorCount} field(s) above to run the backtest.` when any validation error exists, and disable `Run backtest`.
- Show `Period: {formatBacktestPeriod(from, to)}` when `from` and `to` are valid.
- Show optional handoff note banner (for example `Loaded {name} from Strategy Engine. Run the backtest to see its results.`).

Create `apps/web/app/pages/Backtest/components/RunStatusCard.tsx`:

- Show when a watched run exists under `Set up & run`.
- Show run title, status `Badge` (`Running`, `Completed`, `Failed`, `Cancelled`), run ID, and start time.
- While `status === 'running'`: show `role="progressbar"` (`aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow={run.progressPercent}`) and `Cancel run` button (disabled with label `Cancellingâ€¦` while cancel mutation is pending).
- For `completed`: show summary and `View run details` plus `Dismiss` buttons.
- For `failed`: show `run.failureReason` and `View run details` plus `Dismiss` buttons.
- For `cancelled`: show `Cancelled before it finished. Nothing was kept from this run.` and `Dismiss` button.

Create `apps/web/app/pages/Backtest/components/ActiveRunConflictDialog.tsx` using `Dialog`:

- Title: `A backtest is already running`.
- Description names the active run (`{activeRun.id}`, `{activeRun.strategyName}`, `{activeRun.progressPercent}%`) and states that only one manual backtest can run at a time.
- Show status text `Cancelling the running backtest. The new one starts as soon as it stops.` while `cancelling` is true.
- Buttons (all disabled while `cancelling` is true):
  - `Close`: closes the dialog and keeps entered form values.
  - `View running run`: closes the dialog and opens the active run detail view.
  - `Cancel it and run the new one` (label `Cancellingâ€¦` while pending): awaits `cancelBacktest(activeRun.id)` first, then submits the pending `CreateBacktestInput`.

- [x] **Step 2: Create `RunsListView.tsx` and `RunDetailView.tsx`**

Create `apps/web/app/pages/Backtest/components/RunsListView.tsx`:

- Show loading `Skeleton` rows while `useBacktestRuns()` loads.
- Show error `Alert` with `Retry` button when `useBacktestRuns()` fails.
- Show empty state `No runs yet` with button `Set up a backtest` when runs list is empty.
- List manual runs newest first. Each row shows strategy name, pair, timeframe, date range, run ID, start time, strategy version, status `Badge`, result label (or `{progressPercent}%` when running), and `Open` button.

Create `apps/web/app/pages/Backtest/components/RunDetailView.tsx`:

- Accept `runId`, `onBack`, `onRunAgain(run)`, `onCopySettings(run)`, and optional `renderResults?: (detail: BacktestRunDetail) => React.ReactNode`.
- Show `All runs` button to return to `RunsListView`.
- Show loading `Skeleton` while `useBacktestRunDetail(runId)` loads. Show error `Alert` with `Retry` button on failure.
- When `detail` loads, show:
  - Title, status `Badge`, run ID, start and end timestamps.
  - Snapshot drift note when `detail.drift` indicates a change:
    - Deleted: `{detail.strategyName} is no longer in your library. The settings and rules below are the copy this run used.`
    - Renamed or newer version: `This strategy is now called {currentName}.` and `It is now at v{currentVersion}. This run used v{strategyVersion}, shown below.`
  - Progress bar and `Cancel run` button when `detail.status === 'running'`.
  - Failure reason box when `detail.status === 'failed'`, or cancelled notice when `detail.status === 'cancelled'`.
  - `Settings used` grid (strategy and version, pair, timeframe, date range, capital, fee, slippage) and `Strategy rules at run time` list.
  - Actions: `Run again with these settings` (or `Retry with these settings` for failed runs) and `Copy settings to a new backtest`.
  - Render `renderResults?.(detail)` when `detail.status === 'completed'` and `detail.result` exists.

- [x] **Step 3: Create `BacktestPage.tsx` and wire `apps/web/app/routes/backtest.tsx`**

Create `apps/web/app/pages/Backtest/BacktestPage.tsx`:

- Render `<h1 className="text-3xl font-semibold tracking-tight">Backtest</h1>` and subtitle `Replay a strategy over a past period, with fees and slippage, trade by trade.`
- Render `role="tablist"` (`aria-label="Backtest views"`) with tabs `Set up & run` and `Runs ({runs.length})`.
- Read `?run=<id>` and `?strategy=<id>` from `useSearchParams()` plus optional router state (`from`, `unsavedRules`).
  - `?run=<id>` opens `Runs` tab with `RunDetailView` for that run.
  - `?strategy=<id>` preselects that strategy in `BacktestSetupForm` and shows the handoff note.
- On `Run backtest` submit:
  - Call `createBacktest.mutateAsync(input)`.
  - On success: set `watchedRunId` to the new run ID and show Sonner toast `Backtest {id} started. You can keep working in other tabs.`
  - On `BacktestApiError` with code `'BACKTEST_ALREADY_RUNNING'` and `activeRun`: open `ActiveRunConflictDialog` with `activeRun` and the pending form payload.
- On `Run again with these settings` / `Retry with these settings`: switch to `Set up & run`, populate form values (including unsaved rules when deleted from Library), and trigger submission.
- On `Copy settings to a new backtest`: switch to `Set up & run` and populate form values without starting a run.

Update `apps/web/app/routes/backtest.tsx` to render `<BacktestPage />` instead of `<ScreenPlaceholder title="Backtest" />`.

- [x] **Step 4: Run typecheck, lint, tests, and prettier**

Run: `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint apps/web/app/routes/backtest.tsx apps/web/app/pages/Backtest/BacktestPage.tsx apps/web/app/pages/Backtest/components/BacktestSetupForm.tsx apps/web/app/pages/Backtest/components/RunStatusCard.tsx apps/web/app/pages/Backtest/components/ActiveRunConflictDialog.tsx apps/web/app/pages/Backtest/components/RunsListView.tsx apps/web/app/pages/Backtest/components/RunDetailView.tsx && pnpm exec prettier --check apps/web/app/routes/backtest.tsx apps/web/app/pages/Backtest/BacktestPage.tsx apps/web/app/pages/Backtest/components/BacktestSetupForm.tsx apps/web/app/pages/Backtest/components/RunStatusCard.tsx apps/web/app/pages/Backtest/components/ActiveRunConflictDialog.tsx apps/web/app/pages/Backtest/components/RunsListView.tsx apps/web/app/pages/Backtest/components/RunDetailView.tsx`
Expected: PASS. Typecheck exits with code 0, Vitest passes, ESLint exits with code 0, and Prettier reports all files formatted.

- [x] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-05-backtest-setup-and-runs.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-05-backtest-setup-and-runs.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-05-backtest-setup-and-runs.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-05-backtest-setup-and-runs.md`.
5. Mark Step 5 as `- [x]`, stop, and send the report summary.
