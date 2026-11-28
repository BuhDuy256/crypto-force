# Task 4 Report: Strategy Library Screen and Workspace Navigation

Read this file to learn what Task 4 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Change `apps/web/app/routes.ts`: the workspace layout registers `library` directly after `strategy`.
- Create `apps/web/app/routes/library.tsx`: the route renders `StrategyLibraryPage` and sets the page title.
- Change `apps/web/app/layouts/workspace/AppHeader.tsx`: the Strategy Engine tab stays active on `/library`, the running-backtest pill links to its run, and Sign out asks for confirmation while a run is active.
- Change `apps/web/app/layouts/workspace/MobileNav.tsx`: the drawer applies the same Strategy Engine active rule.
- Create `apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx`: the library list with filter pills, search, signal-source line, loading, error, empty, and no-match states.
- Create `apps/web/app/pages/StrategyLibrary/components/StrategyDetailDrawer.tsx`: the detail drawer with rename, duplicate, delete with Undo, signal-source action, recent runs, and footer links.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: the Task 4 row is `Done` with the report link.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-04-strategy-library-and-navigation.md`: Steps 1 to 5 are checked.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-04-strategy-library-and-navigation.md`: this report.

## Implementation notes

- `NavLink` cannot set `aria-current="page"` when its own match is false. The header and the mobile drawer use `Link` with a computed active flag, so `/library` marks the Strategy Engine tab.
- The selected signal source is stored in browser storage under `cf.signal-source-id`. The page reads the name from the current library list. A deleted or missing item falls back to `MA Crossover (built-in)`. The Realtime screen does not read this value yet.
- The page keeps a temporary copy of a duplicated item. The drawer stays mounted while the list refetches and switches to the copy with the rename input open.
- The drawer renders only when `?open=<id>` matches an item. Closing the drawer deletes the `open` parameter.
- Filters and search run in the browser. The counts come from the full list, so they do not change when a filter is active.
- The delete toast stays for 8 seconds. Its Undo action calls `useRestoreStrategy`.
- The header shows the running-backtest pill only when the active-run endpoint returns a run with `running` status. The mock returns no active run by default, so the pill stays hidden until a run is running.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm --filter @crypto-force/web typecheck` | 0 | No output |
| `pnpm exec eslint` on the route and the five changed or new files | 0 | No output |
| `pnpm exec prettier --write` on the six changed or new source files | 0 | Two files written, four files unchanged |
| `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint <six files> && pnpm exec prettier --check <six files>` | 0 | No typecheck output, `Test Files 7 passed (7)`, `Tests 32 passed (32)`, no ESLint output, `All matched files use Prettier code style!` |
| `pnpm exec prettier --check` on the three changed Markdown files | 0 | `All matched files use Prettier code style!` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)` in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`; none in a file changed by this task |

The `pnpm check:docs` problems come from existing files outside this task. The `Files` block does not allow changes to them. The changed Markdown files pass the Prettier check.

## What the commands do not prove

- No browser opened `/library`. The filter pills, search, empty and no-match cards, drawer, rename keys, duplicate flow, delete dialog, Undo toast, signal-source toast, and header pill did not run. Focus order, Esc handling, `aria-pressed`, and layout at each breakpoint are unverified.
- No test renders the page, the drawer, or the header. The 32 existing tests pass and none of them import the new files.
- No test connects the actions to the MSW handlers. Rename validation, the duplicate copy, the delete and restore calls, and the signal-source storage key are unverified.
- No test checks that `/library` marks the Strategy Engine tab active in both the header and the drawer.
- The signal source is browser-only state for Phase 1. The Open Realtime link opens `/realtime`, but that screen does not consume the selected source.
- `pnpm check:exports` did not run. The new page and drawer exports are consumed only by the route and the page.
- `pnpm build` did not run, so the production bundle does not prove that the new modules resolve.
