# Task 8 Report: Prototype Parity for Strategy Engine, Strategy Library, and Backtest

Read this file to learn what Task 8 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Change `packages/shared/src/schemas/strategy.schema.ts`: the preview response has the required fields `suggestedName` and `suggestedTags`.
- Change `apps/web/mocks/fixtures/strategy-backtest.ts`: the mock result calculates in cents. It returns 178 trade rows, an equity curve with 179 points, and 96 price candles of 15 minutes. The summary totals, the drawdown, and the win count come from these rows. The preview returns a suggested name and suggested tags, and its assumptions do not contain the SHORT line. `formatResultLabel` makes the run result label.
- Change `apps/web/mocks/backtest.handlers.ts`: a completed run uses `formatResultLabel`. The task deleted the unused `resetMockBacktestStore`.
- Change `apps/web/mocks/strategy.handlers.ts`: the task deleted the unused `resetMockStrategyStore`.
- Test `apps/web/mocks/strategy-backtest.test.ts`: a header comment and a test for the 178 trade rows and their totals at two cost settings.
- Change `apps/web/app/utils/strategy-draft.ts`: `formatBacktestPeriod` uses `→`. New `formatRunTitle` and `formatRunPeriod`.
- Test `apps/web/app/utils/strategy-draft.test.ts`: the `→` separator and a test for the run title date range.
- Create `apps/web/app/hooks/useBacktestFinishNotice.ts`: a toast with a `View run` action when the running backtest completes or fails. A cancelled run gets no toast.
- Change `apps/web/app/layouts/workspace/AppHeader.tsx`: uses `useBacktestFinishNotice`, so the toast shows on every workspace screen.
- Change `apps/web/app/hooks/useBacktestCharts.ts`: the account value chart shows peak and low labels, and the drawdown fill starts at zero. The price chart shows the volume in its own pane. Trade markers sit on their candles, and only the first entry of each side and the first exit have a label.
- Change `apps/web/app/components/ui/button.tsx`: the `outline`, `ghost`, and `default` variants set their own text color and no underline.
- Change `apps/web/app/api/strategies.ts` and `apps/web/app/hooks/useStrategies.ts`: `StrategyApiError` and `strategyKeys` are not exported.
- Create `apps/web/app/pages/StrategyEngine/components/WorkspaceStatus.tsx`: the status chip next to each card heading.
- Change `apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx`: the two-column layout, the suggested name and tags, the `Saved` status, and a number for a suggested name that the library already has.
- Change the four cards in `apps/web/app/pages/StrategyEngine/components/`: status chips, `(assumed)` labels, side icons, and a `Copied` label for one preview. The action links have the link style, the description field is taller, and the buttons in the recent library table use the theme text color.
- Change `apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx`: the plus icon on `New strategy` and the full-size row buttons.
- Create `apps/web/app/pages/Backtest/components/InfoTip.tsx`: an info button whose text opens on hover, focus, or tap and closes on Escape.
- Change `apps/web/app/pages/Backtest/BacktestPage.tsx` and six files in `apps/web/app/pages/Backtest/components/`: the results show the run title and meta, and Run detail shows a plain `Results` heading. The setup form has one row with tips, and the trade table shows page numbers. The status card, the runs list, and Run detail use the run title format. A caption tells which part of the run the price chart shows.
- Test `apps/web/e2e/strategy-backtest/flows.spec.ts` and `apps/web/e2e/strategy-backtest/states.spec.ts`: assertions for the suggested name, the finish toast, the run title and meta, and the numbered trade pages. The preview double returns the new fields.
- Change `README.md`: the `Phase 1 prototype parity` decision row, Task 7 `Done`, Task 8 `Done`, and the use case task as Task 9.
- Change `reports/task-07-browser-verification-suite.md`: a pointer to this report.
- Rename `plan/task-08-draft-use-cases.md` to `plan/task-09-draft-use-cases.md`.
- Create `plan/task-08-prototype-parity.md` and this report.

## Implementation notes

- The prototype values stay the same: 178 trades, gross `+22.66`, fees `8.90`, slippage `5.34`, and net `+8.42` USD. Two values come from the rows and are different from the prototype text: max drawdown `-3.07` USD (`-2.90`%) and win rate `104` of `178`.
- The suggested name gets a number when the library already has the name, for example `RSI_BB_LB_LONG_SL2_TP4 2`. This is an agent decision under product-owner delegation. It follows the `uniqueName` rule of the Duplicate action in `Library.dc.html`.
- The App Header search, notifications panel, and market data indicator are not in Phase 1. Stored notifications need the Phase 4 API design.

## Review findings

The `review-change` subagent reported 19 findings. Task 8 fixed these:

- The fixture test asserts literal prototype values and hand-calculated values. It does not calculate the result again with the fixture logic.
- Each new assertion has a mutant result (see [Mutants](#mutants)). The test files name these faults in their header comments.
- Run detail has one run title heading. The results in Run detail use a plain `Results` heading.
- `InfoTip` meets WCAG 1.4.13: the pointer can move onto the text, Escape closes it, and a tap opens it.
- `Copied` belongs to one preview. A new preview after a save clears `Saved`.
- The price chart tells which part of the run it shows.
- Task 7 stayed `Pending` until the product owner approved its report on 2026-11-28.

Task 8 kept two findings:

- When the library list has not loaded, the suggested name can be a duplicate. The Name field then shows the duplicate-name error, and the user changes the name.
- The trade labels under the account value chart use a fixed right padding (`pr-16`) for the price scale. The labels can move by a few pixels.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm exec eslint` on the changed `.ts` and `.tsx` files | 0 | No output |
| `pnpm --filter @crypto-force/web typecheck` and `pnpm --filter @crypto-force/shared typecheck` | 0 | No output |
| `pnpm --filter @crypto-force/web test` | 0 | `Tests 34 passed (34)` |
| `pnpm --filter @crypto-force/shared test` | 0 | `Tests 194 passed (194)` |
| `pnpm check:exports` | 0 | No unused exports |
| `pnpm --filter @crypto-force/web build` | 0 | Client and SSR bundles built. `Prerender (html): / -> build\client\index.html`. `Prerender (html): SPA Fallback`. |
| `pnpm exec playwright test --config=playwright.strategy-backtest.config.ts --workers=1` in `apps/web` | 0 | `6 passed (1.3m)` |
| STE linter on the new English text in `docs/build/` | 0 | `0 violations` |

## Mutants

Each mutant made the new assertions fail. The agent restored the code after each run.

- The old fixture with 30 trade rows under a 178-trade summary: the fixture unit test failed on the trade count.
- Trade rows that keep the base fee when the run fee changes: the fixture unit test failed on the fee total `11.13`.
- A run title range with a hyphen instead of the en dash: the `formatRunPeriod` test failed.
- A preview that leaves the Name field empty: the Strategy Engine test and the preview error test failed on the Name value.
- An App Header without `useBacktestFinishNotice`: the Backtest test failed on the finish toast.
- Page buttons that show only the current page: the Backtest test failed on the `Page 18` button.

## What the commands do not prove

- A manual Playwright script checked the Backtest screen at 390 px width (horizontal overflow 0 px). No spec file sets a phone width.
- A pixel comparison of `/`, `/login`, and `/realtime` before and after the shared `Button` change found no button change. The only difference was a clock value on `/realtime`. No test covers this.
- The price chart shows the first 24 hours of the mock run. The mock data is not a real 5-minute history.
- No test checks the peak and low labels, the drawdown fill, or the volume pane. A person checked them in screenshots.
- No test checks the `InfoTip` keyboard and pointer behavior.
- All checks use MSW data or HTTP doubles. They do not prove that the real API returns the new preview fields or the same run results.
