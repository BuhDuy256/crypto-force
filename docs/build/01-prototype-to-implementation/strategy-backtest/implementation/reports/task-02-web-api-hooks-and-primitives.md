# Task 2 Report: Web API Clients, Hooks, Draft Helpers, and Dialog Primitives

Read this file to learn what Task 2 changed, which commands proved it, and what those commands do not prove.

## Files changed

- Create `apps/web/app/utils/strategy-draft.test.ts`: three Vitest cases for draft storage, dirty detection, patch version bumps, period formatting, and future date detection. A header comment names the environment and the source of the expected values, per `docs/conventions/testware.md`.
- Create `apps/web/app/utils/strategy-draft.ts`: `readStrategyDraft`, `writeStrategyDraft`, `clearStrategyDraft`, `isStrategyDraftDirty`, `bumpPatchVersion`, `formatBacktestPeriod`, and `isDateAfterToday`. The storage key is `cf.draftStrategy`, and a draft outside the Zod schema counts as no draft.
- Create `apps/web/app/api/strategies.ts`: `StrategyApiError` and the eight typed Strategy clients with Zod response checks.
- Create `apps/web/app/api/backtest.ts`: `BacktestApiError` and the five typed Backtest clients. A `409` from `POST /api/backtests` carries the blocking run.
- Create `apps/web/app/hooks/useStrategies.ts`: `strategyKeys`, the eight Strategy hooks, and `useStrategyDraftSync`.
- Create `apps/web/app/hooks/useBacktests.ts`: `backtestKeys`, the five Backtest hooks, and the `404` fallback for the active run.
- Create `apps/web/app/components/ui/dialog.tsx`: `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, and `DialogTitle` on `radix-ui`.
- Create `apps/web/app/components/ui/badge.tsx`: `Badge` with `default`, `secondary`, `outline`, `success`, `warning`, `destructive`, and `info` variants.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`: Task 2 row is `Done` with the report link.
- Change `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-02-web-api-hooks-and-primitives.md`: Steps 1 to 6 are checked.
- Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-02-web-api-hooks-and-primitives.md`: this report.

## Implementation notes

- `formatBacktestPeriod` parses both dates as UTC dates. It pads the day to two digits and counts `15 May - 01 May` as 14 days, as the task test requires. It returns `null` for an invalid, equal, or reversed period.
- `listStrategies` sends `kind` and `q` only when the caller defines them, so the mock keeps its own default filter (`kind=all`).
- `useActiveBacktest` turns `BacktestApiError` with status `404` into `{ run: null }`. Other errors still reach the query.
- `useStrategyDraftSync` writes a draft only while `enabled` is true and the form differs from the baseline. It removes the draft when the form matches the baseline or when it is disabled. It keys the effect on serialized state, so a parent render alone does not rewrite `savedAt`. A blocked or full storage does not stop the page.
- The six Strategy mutations and the create and cancel Backtest mutations invalidate `strategyKeys.all` or `backtestKeys.all` on success, so every list and detail view refetches.

## Deviation from the task file

- Step 1 gives exact test code. `docs/conventions/testware.md` requires a header comment in every test file that names the behavior, the environment, the run command, the source of the expected values, and the faults that made a test fail. The test file adds that header. No test input or existing assertion changed. Test 1 is renamed to also name the schema check.
- The exact test code stores the period separator as the mojibake `Â·`. The test uses `·` (U+00B7), the character in the requirement and the prototype.
- The test file adds two assertions: a draft outside the Zod schema returns `null`, and an equal start and end date returns `null`. The task text states both rules but its test code does not assert them.
- Step 5 asked for `pnpm exec prettier --check`. Prettier reported three files on the first run, so the task ran `pnpm exec prettier --write` on the eight code files before the final check.
- The task test formats the period with `->`. The requirement in `docs/design/prototype/docs/requirements/backtest.md` and the prototype screen in `docs/design/prototype/screens/Backtest.dc.html` use `→`. This task follows the task test, and Task 5 must confirm which separator the page shows.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm --filter @crypto-force/web test`, before the helper file | 1 | `Cannot find module './strategy-draft'` |
| `pnpm --filter @crypto-force/web test`, after the first helper version | 1 | Expected `01 May 2025 -> 15 May 2025 · 14 days`, received `1 May 2025 -> 15 May 2025 · 14 days` |
| `pnpm --filter @crypto-force/web test`, after the day padding | 0 | `Test Files 7 passed (7)`, `Tests 32 passed (32)` |
| `pnpm --filter @crypto-force/web test`, with `writeStrategyDraft` as a no-op | 1 | Test 1 failed on `expect(readStrategyDraft(storage)).toEqual(draft)` |
| `pnpm --filter @crypto-force/web test`, with the `hasShort` comparison removed | 1 | Test 2 failed on `expect(isStrategyDraftDirty({ ...base, hasShort: false }, base)).toBe(true)` |
| `pnpm --filter @crypto-force/web test`, with the day padding removed | 1 | Test 3 failed on `01 May 2025 -> ...`, received `1 May 2025 -> ...` |
| `pnpm --filter @crypto-force/web test`, with the Zod guard removed and equal dates accepted | 1 | Test 1 failed on the schema-mismatch assertion and test 3 failed on the equal-date assertion |
| `pnpm --filter @crypto-force/web typecheck`, first run | 2 | `TS2769` and `TS2379` errors for `signal` under `exactOptionalPropertyTypes` |
| `pnpm --filter @crypto-force/web typecheck`, second run | 0 | No output |
| `pnpm exec eslint` on the eight code files | 0 | No output |
| `pnpm exec prettier --check` on the eight code files, first run | 1 | `Code style issues found in 3 files` |
| `pnpm exec prettier --write` on the eight code files | 0 | Three files written, five unchanged |
| `pnpm --filter @crypto-force/web test && pnpm --filter @crypto-force/web typecheck && pnpm exec eslint <eight files> && pnpm exec prettier --check <eight files>` | 0 | `Tests 32 passed (32)`, no typecheck output, no ESLint output, `All matched files use Prettier code style!` |
| `pnpm exec prettier --check` on the three changed Markdown files | 0 | `All matched files use Prettier code style!` |
| `pnpm check:docs` | 1 | `28 documentation problem(s)`. All are in `docs/knowledge/261125-market-data-deep-dive/self-resolve/`, which this task does not touch. `scripts/check-docs.mjs` skips `docs/build/**`. |

## What the commands do not prove

- No test sends an HTTP request through MSW. The clients never ran, so the request paths, the query string, the status handling, the error envelope, the `409` conflict, the `404` fallback, and the Zod response checks are unverified.
- No test renders a hook. Query keys, invalidation after mutations, the 1000 ms polling conditions, and the draft writes are unverified.
- Test 2 shows that the dirty check can fail on `hasShort`. It does not exercise the `editId`, `inputMode`, `prompt`, `url`, `tags`, or `saveName` comparisons one by one.
- Test 3 does not cover an invalid calendar date such as `2025-02-31`.
- No browser opened Dialog or Badge. The visual style, the overlay, the focus trap, the Escape key, and the accessibility behavior are unverified.
- `pnpm check:exports` did not run. Four draft helpers are imported only by the test until Tasks 3 and 5 consume them, so a knip run can report them as unused.
- `pnpm build` did not run, so the production bundle does not prove that the new modules resolve.
- `pnpm check:docs` exits 1 on problems in untouched `docs/knowledge/` files. It also skips `docs/build/**`, so the three changed Markdown files are checked only by Prettier.
