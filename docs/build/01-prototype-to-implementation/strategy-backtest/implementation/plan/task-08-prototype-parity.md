# Task 8: Prototype Parity for Strategy Engine, Strategy Library, and Backtest

Read this file to learn Task 8 steps. Task 8 closes the gaps between the Phase 1 screens and the prototype code before Task 9 writes the use cases.

> **Record of completed work:** The product owner approved the scope of this task on 2026-11-28, after a gap review against `docs/design/prototype/screens/`. The agent did the work in the same session and wrote this file after the work. All steps are complete.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- The `Phase 1 prototype parity` row in [Decisions](../README.md#decisions)
- `docs/design/prototype/screens/Strategy.dc.html`
- `docs/design/prototype/screens/Library.dc.html`
- `docs/design/prototype/screens/Backtest.dc.html`
- `docs/design/prototype/screens/AppHeader.dc.html`
- `docs/conventions/code.md` and `docs/conventions/testware.md`

Do not use the documents in `docs/design/prototype/docs/` as the source of truth for this task. Use the prototype code.

**Files:**

- Change: `packages/shared/src/schemas/strategy.schema.ts`
- Change: `apps/web/mocks/fixtures/strategy-backtest.ts`, `apps/web/mocks/backtest.handlers.ts`, `apps/web/mocks/strategy.handlers.ts`
- Test: `apps/web/mocks/strategy-backtest.test.ts`
- Change: `apps/web/app/utils/strategy-draft.ts`
- Test: `apps/web/app/utils/strategy-draft.test.ts`
- Create: `apps/web/app/hooks/useBacktestFinishNotice.ts`
- Change: `apps/web/app/hooks/useBacktestCharts.ts`, `apps/web/app/hooks/useStrategies.ts`, `apps/web/app/api/strategies.ts`
- Change: `apps/web/app/components/ui/button.tsx`, `apps/web/app/layouts/workspace/AppHeader.tsx`
- Create: `apps/web/app/pages/StrategyEngine/components/WorkspaceStatus.tsx`
- Change: `apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx` and the four cards in `apps/web/app/pages/StrategyEngine/components/`
- Change: `apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx`
- Create: `apps/web/app/pages/Backtest/components/InfoTip.tsx`
- Change: `apps/web/app/pages/Backtest/BacktestPage.tsx` and six files in `apps/web/app/pages/Backtest/components/`
- Test: `apps/web/e2e/strategy-backtest/flows.spec.ts`, `apps/web/e2e/strategy-backtest/states.spec.ts`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-07-browser-verification-suite.md`
- Rename: `plan/task-08-draft-use-cases.md` to `plan/task-09-draft-use-cases.md`
- Create: this file and `reports/task-08-prototype-parity.md`

**Interfaces:**

- `strategyPreviewResponseSchema` gets two required fields: `suggestedName` (1 to 60 characters) and `suggestedTags` (each tag 1 to 32 characters).
- `createMockRunResult(feePercent, slippageBps)` returns 178 trade rows. The summary totals, the equity curve, and the drawdown come from these rows.
- `formatRunTitle(run)` returns `<strategy> · <pair> <timeframe> · <DD Mon YYYY> – <DD Mon YYYY>`. `formatBacktestPeriod` uses `→` between the two dates.
- `useBacktestFinishNotice(activeRun)` shows a toast with a `View run` action when the running backtest completes or fails.

**STOP when:**

- The output of a command does not match `Expected`.
- A gap needs a decision that the `Phase 1 prototype parity` row does not contain.
- The same step fails two times.

**Forbidden:**

- Add the App Header search, notifications panel, or market data indicator.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Use `useEffect` outside `apps/web/app/hooks/`.

- [x] **Step 1: Make the mock result use one set of trade rows**

Write a failing unit test first. The test must assert the prototype values: 178 trades, gross `22.66`, fees `8.90` (`0.05` for each trade), slippage `5.34` (`0.03` for each trade), and net `8.42` USD. Add a second case with fee `0.10`% and slippage `12` bps: fees `11.13`, slippage `12.82`, net `-1.29` USD. Then change the fixture to calculate in cents so that the sums are exact. Use `formatResultLabel` for the seeded run and for the handler.

- [x] **Step 2: Close the Strategy Engine gaps**

Add `suggestedName` and `suggestedTags` to the preview contract. Fill the Name and Tags fields from the preview only when they are empty. When the library already has the suggested name, add the first free number. Delete the SHORT line from the fixture assumptions, because the preview card owns that line. Add `(assumed)` to the Timeframe and Pairs rows. Use the two-column layout from the prototype. Add the status chips.

- [x] **Step 3: Close the Backtest gaps**

Add the run title and meta to the results. Show a plain `Results` heading in Run detail. Add numbered trade pages. Put the setup fields in one row and add the Fee and Slippage tips. In the charts, show peak and low labels. Fill the drawdown between zero and the line. Put the volume in its own pane. Label only the first entry of each side and the first exit. Add `useBacktestFinishNotice` to `AppHeader`.

- [x] **Step 4: Fix the shared button and the unused exports**

Give the `outline`, `ghost`, and `default` button variants their own text color, so that a link inside a button does not use the link color. Delete the unused exports that `pnpm check:exports` reports.

- [x] **Step 5: Check and record**

Run: `pnpm exec eslint <changed files>`, `pnpm --filter @crypto-force/web typecheck`, `pnpm --filter @crypto-force/shared typecheck`, `pnpm --filter @crypto-force/web test`, `pnpm --filter @crypto-force/shared test`, `pnpm check:exports`, `pnpm --filter @crypto-force/web build`, and `pnpm exec playwright test --config=playwright.strategy-backtest.config.ts --workers=1` in `apps/web`.
Expected: PASS for all commands. Run a mutant for each new assertion and record the result. Run the `review-change` skill and fix its findings. Write `reports/task-08-prototype-parity.md`.
