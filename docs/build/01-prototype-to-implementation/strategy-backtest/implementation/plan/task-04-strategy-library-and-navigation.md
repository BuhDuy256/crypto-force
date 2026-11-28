# Task 4: Strategy Library Screen and Workspace Navigation

Read this file to learn Task 4 steps, which add `/library`, Strategy Library with its detail drawer, and AppHeader backtest updates.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `apps/web/app/routes.ts` (lines 1-20)
- `apps/web/app/layouts/workspace/AppHeader.tsx` (lines 1-59)
- `apps/web/app/layouts/workspace/MobileNav.tsx` (lines 1-91)
- `apps/web/app/hooks/useStrategies.ts` (lines 1-140)
- `apps/web/app/hooks/useBacktests.ts` (lines 1-120)
- `docs/design/prototype/docs/requirements/strategy-engine.md` (lines 100-145)
- `docs/design/prototype/docs/requirements/workspace.md` (lines 1-40)
- `docs/design/prototype/screens/Library.dc.html` (lines 25-210)
- `.agents/skills/tdd/SKILL.md`

**Files:**

- Change: `apps/web/app/routes.ts` (lines 12-18)
- Create: `apps/web/app/routes/library.tsx`
- Change: `apps/web/app/layouts/workspace/AppHeader.tsx` (lines 1-59)
- Change: `apps/web/app/layouts/workspace/MobileNav.tsx` (lines 1-91)
- Create: `apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx`
- Create: `apps/web/app/pages/StrategyLibrary/components/StrategyDetailDrawer.tsx`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-04-strategy-library-and-navigation.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-04-strategy-library-and-navigation.md`

**Interfaces:**

- Uses from `apps/web/app/hooks/useStrategies.ts`:
  - `useStrategyList`, `useRenameStrategy`, `useDuplicateStrategy`, `useDeleteStrategy`, `useRestoreStrategy`
- Uses from `apps/web/app/hooks/useBacktests.ts`:
  - `useActiveBacktest`, `useBacktestRuns`
- Produces in `apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx`:
  - `export function StrategyLibraryPage(): React.JSX.Element`

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Import `useEffect` or `useLayoutEffect` in any file under `apps/web/app/pages/` or `apps/web/app/layouts/`.
- Import `~/api/` in any file under `apps/web/app/pages/` or `apps/web/app/layouts/`.
- Break the immediate Sign out flow when no backtest is running.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [ ] **Step 1: Register `/library` route and update workspace header navigation**

Update `apps/web/app/routes.ts`:

- Add `route('library', 'routes/library.tsx')` inside `layout('routes/workspace-layout.tsx', [...])` directly after `route('strategy', 'routes/strategy.tsx')`.

Create `apps/web/app/routes/library.tsx`:

- Export `meta()` returning `[{ title: 'Strategy library â€“ Crypto Force' }]`.
- Export default `LibraryRoute` rendering `<StrategyLibraryPage />`.

Update `apps/web/app/layouts/workspace/AppHeader.tsx` and `apps/web/app/layouts/workspace/MobileNav.tsx`:

- Check `useLocation().pathname`. Mark the `/strategy` tab link active (`aria-current="page"` and active styles) when pathname is `/strategy` or `/library`.
- In `AppHeader.tsx`:
  - Call `useActiveBacktest()`.
  - When `activeRun` exists (`activeRun.status === 'running'`), render a pill link to `/backtest?run=${activeRun.id}` labeled `Backtest ${activeRun.progressPercent}%` (`aria-label="Open running backtest ${activeRun.id}, ${activeRun.progressPercent}%"`).
  - When `onSignOut` runs and `activeRun` is null, call `signOut.mutate()` directly.
  - When `onSignOut` runs and `activeRun` exists, open a `Dialog` titled `A backtest is still running` with body `Signing out does not stop the running backtest. Results will appear in Runs when you sign in again.`, button `Stay signed in`, and button `Sign out anyway` (calls `signOut.mutate()`).

- [ ] **Step 2: Create `StrategyDetailDrawer.tsx`**

Create `apps/web/app/pages/StrategyLibrary/components/StrategyDetailDrawer.tsx` using `Sheet` (`side="right"`):

- Show item type `Badge` (`Strategy` or `Composite`) and optional `Realtime signal source` badge.
- Show item name heading, or inline rename controls when `renaming` is true:
  - Input (`maxLength={60}`), `Save` button, `Cancel` button, `Enter` saves, `Esc` cancels.
  - Show inline error for blank or duplicate name.
  - Rename calls `useRenameStrategy` and keeps `version` unchanged.
- Show definition list for `Version`, `Source`, `Updated`, and `Created`.
- Show `Rules` list.
- For composites (`kind === 'composite'`), show `Building blocks` with vote method (`Weighted vote` or `Majority vote`) and weights.
- For strategies, show `Description` (when `inputMode === 'prompt'`) or `Imported from` link (when `inputMode === 'url'`).
- Show up to 5 recent runs matching `item.id` from `useBacktestRuns()`, each linking to `/backtest?run={run.id}`. When empty, show `Not backtested yet. Each run keeps a copy of the configuration it ran with, so editing this later does not change past results.`
- Footer actions:
  - `Backtest` link to `/backtest?strategy={item.id}` (router state `{ from: 'your library' }`).
  - `Edit in Strategy Engine` link to `/strategy?edit={item.id}` (or `Edit in Composite builder` link to `/discovery` for composites).
  - `Use as signal source` button is disabled with label `Current signal source` when active. Clicking it updates the selected signal source and shows a toast with `Open Realtime` link to `/realtime`.
  - `Rename` button, `Duplicate` button (calls `useDuplicateStrategy`, switches drawer to the new copy, opens rename input), and `Delete` button.
- Clicking `Delete` opens a `Dialog` titled `Delete "{item.name}"?` stating that past backtest runs keep their own snapshot of the configuration (plus signal-source fallback warning when active). Submitting the dialog calls `useDeleteStrategy`, closes the drawer, and shows an 8-second toast with `Undo` calling `useRestoreStrategy`.

- [ ] **Step 3: Create `StrategyLibraryPage.tsx`**

Create `apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx`:

- Render breadcrumb `Strategy Engine / Library` (`Strategy Engine` links to `/strategy`).
- Render `<h1 className="text-3xl font-semibold tracking-tight">Strategy library</h1>`, `New strategy` link (`/strategy`), and `New composite` link (`/discovery`).
- Render filter pills (`All`, `Strategies`, `Composites` with item counts, `aria-pressed`) and search input (`placeholder="Search by name or tag"`).
- Show current `Realtime signal source` line (defaults to `MA Crossover (built-in)`).
- Show loading `Skeleton` rows while `useStrategyList` loads.
- Show error `Alert` with `Retry` button when `useStrategyList` fails.
- Show `Your library is empty` card with `Create a strategy` and `Build a composite` links when total items equal 0.
- Show `Nothing matches "{q}"` card with `Clear search and filters` button when filtered items equal 0 while total items exceed 0.
- For each item row, show clickable name button (opens drawer), type badge, signal-source badge, metadata (`{source} Â· v{version} Â· Updated {updatedAt}`), tags, last backtest summary (`Last run ...` or `Not backtested yet`), and actions `Backtest`, `Edit`, and `Details`.
- Read `?open=<id>` from `useSearchParams()` to open `StrategyDetailDrawer` for that item. Closing the drawer deletes the `open` query parameter.

- [ ] **Step 4: Run typecheck, lint, tests, and prettier**

Run: `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint apps/web/app/routes.ts apps/web/app/routes/library.tsx apps/web/app/layouts/workspace/AppHeader.tsx apps/web/app/layouts/workspace/MobileNav.tsx apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx apps/web/app/pages/StrategyLibrary/components/StrategyDetailDrawer.tsx && pnpm exec prettier --check apps/web/app/routes.ts apps/web/app/routes/library.tsx apps/web/app/layouts/workspace/AppHeader.tsx apps/web/app/layouts/workspace/MobileNav.tsx apps/web/app/pages/StrategyLibrary/StrategyLibraryPage.tsx apps/web/app/pages/StrategyLibrary/components/StrategyDetailDrawer.tsx`
Expected: PASS. Typecheck exits with code 0, Vitest passes, ESLint exits with code 0, and Prettier reports all files formatted.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-04-strategy-library-and-navigation.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-04-strategy-library-and-navigation.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-04-strategy-library-and-navigation.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-04-strategy-library-and-navigation.md`.
5. Mark Step 5 as `- [x]`, stop, and send the report summary.
