# Task 6 Report: Backtest Results Visualization (Charts, Trades Table, Cost Breakdown)

Read this file to learn what Task 6 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/web/app/hooks/useBacktestCharts.ts`: the account value and drawdown charts, and the price and trades chart. Every chart sets `layout.attributionLogo: true`.
- Create `apps/web/app/pages/Backtest/components/BacktestTradesTable.tsx`: the sortable trades table with 10, 25, and 50 rows per page, and the mobile trade cards.
- Create `apps/web/app/pages/Backtest/components/BacktestResultsSection.tsx`: the stale-inputs banner, the summary metrics, the two chart cards, the trades table, the trading-cost card, and the assumptions card.
- Change `apps/web/app/pages/Backtest/BacktestPage.tsx`: the setup tab loads the latest completed run and renders the results below `RunStatusCard`. The run detail passes `renderResults`.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: the Task 6 row is `Done` with the report link.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-06-backtest-results-visualization.md`: Steps 1 to 5 are checked.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-06-backtest-results-visualization.md`: this report.

The installed `@tanstack/react-table` is version 9.3.1. This version removed `useReactTable`, `getCoreRowModel`, `getPaginationRowModel`, and `getSortedRowModel` from the root export. The table uses the v9 API instead: `useTable`, `tableFeatures`, `rowSortingFeature`, `rowPaginationFeature`, `createSortedRowModel`, and `createPaginatedRowModel`.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm exec prettier --check` on the four source files | 1 | Two files had code style issues: `useBacktestCharts.ts` and `BacktestResultsSection.tsx` |
| `pnpm exec prettier --write` on those two files | 0 | Two files written |
| `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint <four source files> && pnpm exec prettier --check <four source files>` | 0 | No typecheck output, `Test Files 7 passed (7)`, `Tests 32 passed (32)`, no ESLint output, `All matched files use Prettier code style!` |
| `pnpm --filter @crypto-force/web build` | 1 | The client and SSR bundles built, including `backtest-38NFbqbz.js` at 90.78 kB. The prerender of `/` failed with `The operation was aborted due to timeout`. |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`, all in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`; none in a file changed by this task |
| `pnpm exec prettier --check` on the three changed Markdown files | 0 | `All matched files use Prettier code style!` |

## What the commands do not prove

- No browser opened `/backtest`. The results section, the stale banner, the two charts, the full screen mode, the Escape key exit, the trades table, the page size select, the mobile cards, and the responsive layout did not run.
- No test renders the page or the three new modules. The 32 existing tests pass and none of them import the new files.
- No test or browser run exercises the v9 table model. Client sorting, the page size reset to page 1, the disabled Previous and Next states, and the row range text are unverified.
- No test or browser run exercises the chart hooks. The series data, the price lines, the entry and exit markers, the `ResizeObserver` width sync, and the cleanup paths remain unverified.
- The build failure happens in the prerender of `/`. The backtest chunk built, but the command did not finish, so the production build is not proven.
- `pnpm check:exports` did not run. The new modules are imported only by the page and by each other.
- The details view and the setup tab both render the results section. No browser run checks that the two paths show the same content or that the latest completed run is the expected run after a new run finishes.
