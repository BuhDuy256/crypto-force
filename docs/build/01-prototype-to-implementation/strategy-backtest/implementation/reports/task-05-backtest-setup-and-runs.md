# Task 5 Report: Backtest Setup, Active Run Lifecycle, Conflict Dialog, and Runs Views

Read this file to learn what Task 5 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/web/app/pages/Backtest/BacktestPage.tsx`: the Backtest heading, the `Set up & run` and `Runs (N)` tabs, the URL state, run creation, the watched run card, the conflict dialog, and the rerun and copy actions.
- Create `apps/web/app/pages/Backtest/components/BacktestSetupForm.tsx`: the React Hook Form setup with the shared pair and timeframe enums, the date, numeric, and strategy rules, the period line, the handoff note, and the hidden unsaved rules.
- Create `apps/web/app/pages/Backtest/components/RunStatusCard.tsx`: the watched run card with the progress bar, the cancel button, the summary, the failure reason, the cancelled notice, and the dismiss button.
- Create `apps/web/app/pages/Backtest/components/ActiveRunConflictDialog.tsx`: the active-run dialog with the close, view, and cancel-and-run actions.
- Create `apps/web/app/pages/Backtest/components/RunsListView.tsx`: the runs list with the loading, error, empty, and populated states.
- Create `apps/web/app/pages/Backtest/components/RunDetailView.tsx`: the run detail with the drift notes, the progress bar, the cancel action, the settings grid, the rules list, and the rerun and copy actions.
- Change `apps/web/app/routes/backtest.tsx`: the route renders `BacktestPage`.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: the Task 5 row is `Done` with the report link.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-05-backtest-setup-and-runs.md`: Steps 1 to 5 are checked.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-05-backtest-setup-and-runs.md`: this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm exec prettier --write` on the route and the six source files | 0 | Four files written, three files unchanged |
| `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint <route and six source files> && pnpm exec prettier --check <route and six source files>` | 0 | No typecheck output, `Test Files 7 passed (7)`, `Tests 32 passed (32)`, no ESLint output, `All matched files use Prettier code style!` |
| `pnpm exec prettier --check` on the three changed Markdown files | 0 | `All matched files use Prettier code style!` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)` in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`; none in a file changed by this task |

## What the commands do not prove

- No browser opened `/backtest`. The tabs, form errors, summary alert, period line, strategy choices, submit flow, watched run card, conflict dialog, rerun action, copy action, empty state, error states, and layout at each breakpoint did not run.
- No test renders the page or the five components. The 32 existing tests pass and none of them import the new files.
- No test connects the new actions to the MSW handlers. Run creation, the `BACKTEST_ALREADY_RUNNING` flow, cancellation, polling, and the dismiss state are unverified against the mock server.
- The rerun path resets the form and submits it in the same event. No browser run proves that the second submit uses the new values.
- `pnpm check:exports` did not run. The new page and component exports are consumed only by the route and the page.
- `pnpm build` did not run, so the production bundle does not prove that the new modules resolve.
