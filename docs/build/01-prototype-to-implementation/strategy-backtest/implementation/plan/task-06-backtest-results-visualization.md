# Task 6: Backtest Results Visualization (Charts, Trades Table, Cost Breakdown)

Read this file to learn Task 6 steps, which add Lightweight Charts hooks, paginated trades table, summary metrics, and cost breakdown.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `apps/web/app/hooks/useCandlestickChart.ts` (lines 1-100)
- `apps/web/app/pages/Backtest/BacktestPage.tsx` (lines 1-160)
- `apps/web/app/pages/Backtest/components/RunDetailView.tsx` (lines 1-140)
- `docs/design/prototype/docs/requirements/backtest.md` (lines 115-134)
- `docs/design/prototype/screens/Backtest.dc.html` (lines 142-274)
- `.agents/skills/tdd/SKILL.md`

**Files:**

- Create: `apps/web/app/hooks/useBacktestCharts.ts`
- Create: `apps/web/app/pages/Backtest/components/BacktestResultsSection.tsx`
- Create: `apps/web/app/pages/Backtest/components/BacktestTradesTable.tsx`
- Change: `apps/web/app/pages/Backtest/BacktestPage.tsx` (lines 1-160)
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-06-backtest-results-visualization.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-06-backtest-results-visualization.md`

**Interfaces:**

- Uses from `@crypto-force/shared`:
  - Types: `BacktestEquityPoint`, `BacktestPriceCandle`, `BacktestResultSummary`, `BacktestRunDetail`, `BacktestTrade`
- Uses from `lightweight-charts`:
  - `AreaSeries`, `CandlestickSeries`, `ColorType`, `createChart`, `createSeriesMarkers`, `HistogramSeries`, `LineSeries`, `LineStyle`, `type Time`
- Uses from `@tanstack/react-table`:
  - `createColumnHelper`, `flexRender`, `getCoreRowModel`, `getPaginationRowModel`, `getSortedRowModel`, `useReactTable`
- Produces in `apps/web/app/hooks/useBacktestCharts.ts`:
  - `export function useEquityDrawdownChart(equityCurve: BacktestEquityPoint[]): { equityContainerRef: React.RefObject<HTMLDivElement | null>; drawdownContainerRef: React.RefObject<HTMLDivElement | null> }`
  - `export function usePriceTradesChart(input: { priceSeries: BacktestPriceCandle[]; trades: BacktestTrade[]; supportLevel: number; resistanceLevel: number; fullScreen: boolean; onExitFullScreen: () => void }): { containerRef: React.RefObject<HTMLDivElement | null> }`
- Produces in `apps/web/app/pages/Backtest/components/BacktestResultsSection.tsx`:
  - `export function BacktestResultsSection(props: { run: BacktestRunDetail; isStale?: boolean; runDisabled?: boolean; onRunAgain?: () => void; onRevertInputs?: () => void }): React.JSX.Element`
- Produces in `apps/web/app/pages/Backtest/components/BacktestTradesTable.tsx`:
  - `export function BacktestTradesTable(props: { trades: BacktestTrade[] }): React.JSX.Element`

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Omit `attributionLogo: true` on any Lightweight Charts instance.
- Import `useEffect` or `useLayoutEffect` in any file under `apps/web/app/pages/`.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [ ] **Step 1: Create `useBacktestCharts.ts`**

Create `apps/web/app/hooks/useBacktestCharts.ts`:

- `useEquityDrawdownChart(equityCurve)`:
  - Mount an upper Lightweight Charts instance (`height: 200`, `layout.attributionLogo: true`) with an account value `LineSeries` (`--foreground`) and dashed buy-and-hold `LineSeries` (`--muted-foreground`, `LineStyle.Dashed`).
  - Mount a lower Lightweight Charts instance (`height: 90`, `layout.attributionLogo: true`) with a drawdown `AreaSeries` (`--destructive`).
  - Attach `ResizeObserver` to keep chart widths synced with containers and call `chart.remove()` on cleanup.
- `usePriceTradesChart({ priceSeries, trades, supportLevel, resistanceLevel, fullScreen, onExitFullScreen })`:
  - Mount a Lightweight Charts instance (`height: fullScreen ? 520 : 320`, `layout.attributionLogo: true`) with `CandlestickSeries`, volume `HistogramSeries`, `MA(20)` `LineSeries`, and `MA(50)` `LineSeries`.
  - Add horizontal price lines via `candles.createPriceLine(...)` for `Support` (`supportLevel`), `Resistance` (`resistanceLevel`), and the first trade's `Stop loss` and `Take profit`.
  - Attach entry and exit markers via `createSeriesMarkers(candles, markers)` (`arrowUp` for `LONG`, `arrowDown` for `SHORT`, `circle` for `Exit`).
  - Attach a `keydown` listener inside `useEffect` that calls `onExitFullScreen()` when `fullScreen` is true and `event.key === 'Escape'`.

- [ ] **Step 2: Create `BacktestTradesTable.tsx`**

Create `apps/web/app/pages/Backtest/components/BacktestTradesTable.tsx` using `@tanstack/react-table`:

- Define columns in this order: `#`, `Opened`, `Side`, `P/L (USD)`, `P/L %`, `Entry`, `Exit`, `Stop loss`, `Take profit`, `Fee`, `Slippage`, `Held`.
- Enable client-side sorting (`getSortedRowModel()`) and pagination (`getPaginationRowModel()`) with default page size `10`.
- Render a responsive desktop table (`hidden sm:table`) and mobile cards (`sm:hidden`) showing every field with `P/L (USD)` and `P/L %` right after `Side`.
- Render pagination controls:
  - Row range count (`Showing {start}â€“{end} of {total}`).
  - Page size `<select aria-label="Rows per page">` with options `10`, `25`, `50` (changing page size resets page index to `0`).
  - `Previous page` and `Next page` buttons disabled at first and last page.

- [ ] **Step 3: Create `BacktestResultsSection.tsx` and wire it into `BacktestPage.tsx`**

Create `apps/web/app/pages/Backtest/components/BacktestResultsSection.tsx`:

- When `isStale` is true, show warning banner `Inputs changed since this run.` with `Run again` (disabled when `runDisabled`) and `Revert inputs` buttons, and apply `opacity-60` to the results container.
- Render summary metrics strip: `Net return`, `Max drawdown`, `Win rate`, `Trades`, `Per trade`, `vs. buy & hold`, and visual `Return vs. max drawdown` bar. Include accessible explanation tooltips (`title` and `aria-label`) for `Max drawdown`, `Win rate`, `Per trade`, and `vs. buy & hold`.
- Render `Account value and drawdown` card backed by `useEquityDrawdownChart` with legend (`Account value (USD)`, `Buy & hold`, `Drop from previous peak`).
- Render `Price and trades` card backed by `usePriceTradesChart` with latest `MA(20)`, `MA(50)`, `Support`, and `Resistance` values and a `Full screen` toggle button (`aria-pressed={fullScreen}`, `aria-label={fullScreen ? 'Exit full screen' : 'Full screen'}`).
- Render `BacktestTradesTable`.
- Render `Effect of trading costs` card showing `Gross P/L before costs`, `Fees`, `Slippage`, `Net P/L`, and cost share percentage note.
- Render `Assumptions` card listing `run.result.assumptions`.

Update `apps/web/app/pages/Backtest/BacktestPage.tsx`:

- On `Set up & run`, load the latest completed run via `useBacktestRunDetail(latestCompletedRunId)` and render `<BacktestResultsSection>` below `RunStatusCard` with `isStale`, `onRunAgain`, and `onRevertInputs`.
- Inside `RunDetailView`, pass `renderResults={(detail) => <BacktestResultsSection run={detail} />}`.

- [ ] **Step 4: Run typecheck, lint, tests, and prettier**

Run: `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint apps/web/app/hooks/useBacktestCharts.ts apps/web/app/pages/Backtest/components/BacktestResultsSection.tsx apps/web/app/pages/Backtest/components/BacktestTradesTable.tsx apps/web/app/pages/Backtest/BacktestPage.tsx && pnpm exec prettier --check apps/web/app/hooks/useBacktestCharts.ts apps/web/app/pages/Backtest/components/BacktestResultsSection.tsx apps/web/app/pages/Backtest/components/BacktestTradesTable.tsx apps/web/app/pages/Backtest/BacktestPage.tsx`
Expected: PASS. Typecheck exits with code 0, Vitest passes, ESLint exits with code 0, and Prettier reports all files formatted.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-06-backtest-results-visualization.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-06-backtest-results-visualization.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-06-backtest-results-visualization.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-06-backtest-results-visualization.md`.
5. Mark Step 5 as `- [x]`, stop, and send the report summary.
