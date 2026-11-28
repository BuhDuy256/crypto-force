# Task 7 Report: Browser Verification Suite and Production Build Check

Read this file to learn what Task 7 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/web/playwright.strategy-backtest.config.ts`: the Playwright configuration with a `ui` project on port 5185 (no MSW, service workers blocked) and an `msw` project on port 5186 (development worker allowed), each with its own Vite cache directory.
- Test `apps/web/e2e/strategy-backtest/flows.spec.ts`: the Strategy Engine draft, preview, and save handoff flow; the Strategy Library filter, search, rename, duplicate, delete, and undo flow; and the Backtest validation, active-run conflict, chart, trade paging, short-history failure, and snapshot drift flow through the development MSW worker.
- Test `apps/web/e2e/strategy-backtest/states.spec.ts`: the Strategy Library loading, empty, error, and retry states; the Backtest runs loading, empty, error, and retry states; and the Strategy Engine preview error and retry state through controlled HTTP responses.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: the Task 7 row links this report.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-07-browser-verification-suite.md`: Steps 1 to 5 are checked.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-07-browser-verification-suite.md`: this report.

## Deviation from the task description

The task asks the Backtest test to start a run from the form and click `Run backtest` again while the card shows `Running`. The development worker advances a running run by 35 points on every read of the run list, the active run, and any run detail. The reads that follow a form submit finish that run before the conflict dialog can open. The test therefore starts the run that the conflict dialog reports through `POST /api/backtests` from the browser, which is the same endpoint the form calls. The test still checks the `Running` card, the `AppHeader` chip, the dialog, the cancel-and-run action, and the cancelled run in the runs list. A small `page.addInitScript` wrapper holds the run reads while the dialog is open and releases them when the cancel request succeeds, so the conflict is a measured state and not a timing race.

The test also uses `E2E_Contrast` and `e2e-run-2001` as its own fixture values instead of the STLC-like IDs `R-1041` and `R-2001`, because the `testware/no-stlc-ids` lint rule rejects those IDs in test strings.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm --filter @crypto-force/web exec playwright test --config=playwright.strategy-backtest.config.ts` | 0 | `6 passed (1.3m)`: three `msw` tests and three `ui` tests |
| `pnpm exec eslint apps/web/playwright.strategy-backtest.config.ts apps/web/e2e/strategy-backtest/flows.spec.ts apps/web/e2e/strategy-backtest/states.spec.ts` | 0 | No output |
| `pnpm --filter @crypto-force/web build` | 0 | Client and SSR bundles built; `Prerender (html): / -> build/client/index.html`; `Prerender (html): SPA Fallback`; the `reject-production-mocks` plugin did not reject a module |
| `pnpm check:exports` | 1 | `Unused exports (5)`: `StrategyApiError`, `backtestKeys`, `strategyKeys`, `resetMockBacktestStore`, `resetMockStrategyStore`, all created by Tasks 1 and 2 |
| `pnpm exec prettier --check` on the three source files and the three changed Markdown files | 0 | `All matched files use Prettier code style!` |
| `pnpm check:docs` | 1 | Existing problems under `docs/knowledge/261125-market-data-deep-dive/self-resolve/`; none in a file changed by this task |

The `pnpm check:exports` failure is outside this task's `Files` block. Each of the five symbols is used inside its own module, so the production behavior is correct; the exports are only unnecessary. Removing the five `export` keywords would make the check pass. The task row stays `Pending` until a person approves that change.

## What the commands do not prove

- The `check:exports` command does not prove zero unused production exports. Five exports from Tasks 1 and 2 have no importer outside their own module.
- The `ui` tests replace every HTTP response the screen needs. They do not prove that the real API returns the same paths, statuses, or bodies.
- The `msw` tests use the seeded development data in `apps/web/mocks/`. They do not prove that the real backend and worker produce the same strategy versions, run progress, failures, or drift.
- The conflict test creates the blocking run through `POST /api/backtests` instead of a second form submit, for the reason above.
- No accessibility scan runs on the three screens, and no test sets a mobile or tablet viewport.
- The Strategy Engine test covers the description input only. It does not cover importing from a link, duplicate strategy names, the edit flow, the stop-editing dialog, or tag editing.
- The Strategy Library test covers one strategy item. It does not cover the composite drawer, the signal-source action, or the empty-search state.
- The Backtest test does not cover cancelling a watched run from `RunStatusCard`, the rerun and copy-settings actions, the full-screen chart, column sorting, or the results error state.
- The build proves that the production bundle compiles and contains no MSW module. It does not prove runtime behavior of the built app.
