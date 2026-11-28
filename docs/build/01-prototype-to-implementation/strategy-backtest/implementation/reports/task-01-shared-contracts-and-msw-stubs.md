# Task 1 Report: Shared Strategy and Backtest Contracts and MSW Stubs

Read this file to learn what Task 1 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `packages/shared/src/schemas/strategy.schema.ts`: strategy kind, input mode, source, validation check, preview request and response, library item, list response, create, update, and rename schemas with their types.
- Create `packages/shared/src/schemas/strategy.schema.test.ts`: three tests for prompt bounds, URL format, and the 60-character name limit.
- Create `packages/shared/src/schemas/backtest.schema.ts`: timeframe, run status, trade side, backtest input, trade, equity point, price candle, result summary, run, run detail, list response, active run response, and conflict error schemas with their types.
- Create `packages/shared/src/schemas/backtest.schema.test.ts`: three tests for a valid setup, date order, and numeric bounds.
- Change `packages/shared/src/index.ts`: re-export the new strategy and backtest schemas and types.
- Create `apps/web/mocks/fixtures/strategy-backtest.ts`: three library items, the RSI and Bollinger Bands preview, a deterministic result summary, and three seeded runs.
- Create `apps/web/mocks/strategy.handlers.ts`: stateful handlers for preview, list, create, update, rename, duplicate, delete, and restore, plus `resetMockStrategyStore()` and `readMockLibraryItems()`.
- Create `apps/web/mocks/backtest.handlers.ts`: stateful handlers for list, active run, detail, create, and cancel, plus `resetMockBacktestStore()`. Reads advance a running job by 35 points.
- Change `apps/web/mocks/handlers.ts`: combine market data, strategy, and backtest handlers.
- Create `apps/web/mocks/strategy-backtest.test.ts`: schema checks for the previews, the library, the runs, the detail, and the P/L accounting invariant.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: Task 1 status and report link.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-01-shared-contracts-and-msw-stubs.md`: step checkboxes.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-01-shared-contracts-and-msw-stubs.md`: this report.

## Implementation notes for later tasks

- `createMockRunResult` keeps `grossPnlUsd - totalFeeUsd - totalSlippageUsd = netPnlUsd` for every fee and slippage input. At `0.08` percent and `5` bps the totals are `22.66`, `8.90`, `5.34`, and `8.42` USD.
- `createMockRunResult` returns 30 trade rows, 60 equity and drawdown points, and 60 price candles with MA20 and MA50.
- A new run starts at `progressPercent: 15`. Each read of `GET /api/backtests`, `GET /api/backtests/active`, or `GET /api/backtests/:id` advances a running run by 35 points. A run completes or fails at 100 points.
- A run fails when `from` is before the pair listing date: `BTCUSDT` and `ETHUSDT` at `2017-08-17`, `SOLUSDT` at `2020-08-11`.
- Preview extraction accepts only these hosts: `tradingview.com`, `medium.com`, `gist.github.com`, `blogspot.com`, and `docs.google.com`. Other hosts return `422` with code `EXTRACTION_FAILED`.
- `GET /api/backtests/active` returns `{ run: null }` when no run is active. The header fallback for `404` stays untested.
- Run detail drift is live. `deletedFromLibrary` is true only when a run has a `strategyId` that is no longer in the library.

## Deviation from the task file

Step 5 gave exact test code, and Step 8 required ESLint to pass. ESLint reads `apps/web/mocks/fixtures/` as app source, not test code, so `testware/no-implementation-oracle` rejected five assertions in that exact code. The test file keeps every assertion, but it moves them into typed helper functions that receive the fixture output as a parameter. No assertion was deleted or weakened.

Step 8 also asked for `pnpm exec prettier --check`. Prettier reported three files on the first run, so the task ran `pnpm exec prettier --write` on those files before the final check.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm --filter @crypto-force/shared test`, before the schema files | 1 | `Cannot find module './strategy.schema'` and `Cannot find module './backtest.schema'` |
| `pnpm --filter @crypto-force/shared test`, after the schema files | 0 | `Test Files 7 passed (7)`, `Tests 194 passed (194)` |
| `pnpm --filter @crypto-force/shared typecheck` | 0 | No output |
| `pnpm --filter @crypto-force/web test`, before the fixture file | 1 | `Cannot find module './fixtures/strategy-backtest'` |
| `pnpm --filter @crypto-force/web test`, after the fixture and handler files | 0 | `Test Files 6 passed (6)`, `Tests 29 passed (29)` |
| `pnpm --filter @crypto-force/web typecheck`, first run | 2 | Five `TS2345` errors for `params.id` in `mocks/strategy.handlers.ts` |
| `pnpm --filter @crypto-force/web typecheck`, after the `paramId` helper | 0 | No output |
| `pnpm exec eslint` on the ten changed code files, first run | 1 | Five `testware/no-implementation-oracle` errors in `mocks/strategy-backtest.test.ts` |
| `pnpm exec eslint` on the ten changed code files, after the test helper change | 0 | No output |
| `pnpm exec prettier --check` on the ten changed code files, first run | 1 | `Code style issues found in 3 files` |
| `pnpm exec prettier --write` on the three reported files | 0 | Three file names with write times |
| `pnpm exec prettier --check` on the ten changed code files, second run | 0 | `All matched files use Prettier code style!` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`. All 28 are in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`, which this task does not touch. `scripts/check-docs.mjs` skips `docs/build/**`, so it does not check the changed docs. |

## What the commands do not prove

- No test sends an HTTP request through MSW. The handlers never ran, so the status codes, the response bodies, the in-memory transitions, the 409 conflict payload, the preview host check, and the live drift calculation are unverified.
- The tests check that the fixtures satisfy the Zod schemas. They do not check that the seeded values match the prototype screen values beyond the items and totals this task names.
- No browser opened the app. The mocks are not proven to load behind `VITE_API_MOCKING=true`, and no screen consumes them yet.
- The listing dates and failure messages are fixture constants. No Binance API call confirms them.
- `pnpm check:docs` exits 1 on pre-existing problems in untouched `docs/knowledge/` files. It also skips `docs/build/**`, so the three changed Markdown files are checked only by Prettier.
