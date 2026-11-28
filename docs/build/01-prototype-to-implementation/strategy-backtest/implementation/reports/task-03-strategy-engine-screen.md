# Task 3 Report: Strategy Engine Screen

Read this file to learn what Task 3 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx`: the interactive screen. It reads `?edit=<id>`, restores a matching browser draft, syncs edits with `useStrategyDraftSync`, shows the editing and draft banners, runs the preview mutation, saves with the create or update mutation, and opens the discard dialog.
- Create `apps/web/app/pages/StrategyEngine/components/StrategyInputCard.tsx`: the two input tabs, the prompt and URL fields, the URL check, the preview buttons, and the clear action.
- Create `apps/web/app/pages/StrategyEngine/components/StrategyPreviewCard.tsx`: the loading, error, and empty states, the rules table, the assumption warning, and the JSON section.
- Create `apps/web/app/pages/StrategyEngine/components/StrategySaveCard.tsx`: the validation checks, name field, version output, tag editor, source readout, and save button.
- Create `apps/web/app/pages/StrategyEngine/components/RecentLibraryCard.tsx`: the three most recent library rows with the Backtest and Open links.
- Change `apps/web/app/routes/strategy.tsx`: the route renders `StrategyEnginePage` and no longer uses `ScreenPlaceholder`.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: the Task 3 row is `Done` with the report link.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-03-strategy-engine-screen.md`: Steps 1 to 5 are checked.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-03-strategy-engine-screen.md`: this report.

## Implementation notes

- The page has no effect import. The draft snapshot is read in a `useState` initializer. Every later form change goes through `useStrategyDraftSync`.
- The content component uses `key={editId ?? 'new'}`, so a different `?edit=` value starts a fresh form. A new save calls `setSearchParams({ edit: saved.id }, { replace: true })` after the create mutation.
- Edit mode builds the preview from the saved library item because no preview endpoint accepts a saved item and the page must open the preview without an effect. The rules, short example, risk lines, and JSON come from the item. The timeframe and pair lines are marked as assumed.
- The preview request keeps a request ID. A result from an older request does not replace the form after the user changes the input.
- A successful update also stores the saved item as the draft baseline. This stops the draft sync from writing the old draft again before the list refetch finishes.
- The 8-second duration applies to the clear, short removal, tag removal, and save toasts.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm --filter @crypto-force/web typecheck`, first run | 0 | No output |
| `pnpm exec eslint` on the route and the five new files | 0 | No output |
| `pnpm --filter @crypto-force/web test` | 0 | `Test Files 7 passed (7)`, `Tests 32 passed (32)` |
| `pnpm exec prettier --check` on the route and the five new files | 1 | `Code style issues found in 3 files` |
| `pnpm exec prettier --write` on the three flagged files | 0 | Three files written |
| `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint <six files> && pnpm exec prettier --check <six files>` | 0 | No typecheck output, `Tests 32 passed (32)`, no ESLint output, `All matched files use Prettier code style!` |
| `pnpm exec prettier --check` on the three changed Markdown files | 0 | `All matched files use Prettier code style!` |

## What the commands do not prove

- No browser opened the screen. The tabs, preview, toast actions, draft banner, discard dialog, and save flow did not run. Focus handling, keyboard order, `aria-expanded`, and layout at each breakpoint are unverified.
- No test renders the page or any card. The existing 32 tests pass and none of them import the new files.
- No test connects the buttons to the MSW handlers. The preview request, URL rejection, duplicate-name error, create and update payloads, and the edit query flow are unverified.
- The preview built from a saved item does not prove that the saved rules match a real preview response for the same strategy. It is an example reconstruction for Phase 1.
- `pnpm check:exports` did not run. The page and card exports are consumed only by the route.
- `pnpm build` did not run, so the production bundle does not prove that the new modules resolve.
