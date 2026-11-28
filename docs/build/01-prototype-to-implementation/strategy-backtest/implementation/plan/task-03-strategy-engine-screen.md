# Task 3: Strategy Engine Screen

Read this file to learn Task 3 steps, which implement the interactive Strategy Engine screen, draft recovery, and recent library panel.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `apps/web/app/routes/strategy.tsx` (lines 1-10)
- `apps/web/app/pages/Realtime/RealtimePage.tsx` (lines 1-49)
- `apps/web/app/hooks/useStrategies.ts` (lines 1-140)
- `apps/web/app/utils/strategy-draft.ts` (lines 1-120)
- `docs/design/prototype/docs/requirements/strategy-engine.md` (lines 1-105)
- `docs/design/prototype/screens/Strategy.dc.html` (lines 48-210)
- `.agents/skills/tdd/SKILL.md`

**Files:**

- Create: `apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx`
- Create: `apps/web/app/pages/StrategyEngine/components/StrategyInputCard.tsx`
- Create: `apps/web/app/pages/StrategyEngine/components/StrategyPreviewCard.tsx`
- Create: `apps/web/app/pages/StrategyEngine/components/StrategySaveCard.tsx`
- Create: `apps/web/app/pages/StrategyEngine/components/RecentLibraryCard.tsx`
- Change: `apps/web/app/routes/strategy.tsx` (lines 1-10)
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-03-strategy-engine-screen.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-03-strategy-engine-screen.md`

**Interfaces:**

- Uses from `apps/web/app/hooks/useStrategies.ts`:
  - `useStrategyList`, `usePreviewStrategy`, `useCreateStrategy`, `useUpdateStrategy`, `useStrategyDraftSync`
- Uses from `apps/web/app/utils/strategy-draft.ts`:
  - `readStrategyDraft`, `clearStrategyDraft`, `isStrategyDraftDirty`, `bumpPatchVersion`
- Produces in `apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx`:
  - `export function StrategyEnginePage(): React.JSX.Element`

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Import `useEffect` or `useLayoutEffect` in any file under `apps/web/app/pages/`.
- Import `~/api/` in any file under `apps/web/app/pages/`.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [ ] **Step 1: Create `StrategyInputCard.tsx` and `StrategyPreviewCard.tsx`**

Create `apps/web/app/pages/StrategyEngine/components/StrategyInputCard.tsx`:

- Show two tabs in a `role="tablist"` (`aria-label="Input type"`): `Describe it` and `Import from a link`.
- In `Describe it`:
  - Show a `<textarea>` with label `Describe your trading strategy`, `maxLength={1000}`, and character counter `{count}/1000`.
  - Show `Preview example rules` button (disabled while `isPending`, label `Preparing previewâ€¦`) and `Clear` button.
  - Clicking `Clear` clears the prompt, clears the preview, and triggers an 8-second Sonner toast (`Description cleared.`) with an `Undo` action that restores the previous prompt.
- In `Import from a link`:
  - Show an `<input type="url">` with label `Link to a strategy write-up`.
  - Check `http://` or `https://` plus a domain on submit. Show inline error `Enter a full link starting with https://` with `aria-invalid="true"`.
  - Show `Extract from page` button (disabled while `isPending`, label `Reading pageâ€¦`).
- Switching input tabs or changing prompt/URL clears the current preview.

Create `apps/web/app/pages/StrategyEngine/components/StrategyPreviewCard.tsx`:

- Show loading `Skeleton` while preview mutation is pending.
- Show an error `Alert` with a `Retry` button when preview fails with an API error.
- Show empty state `No preview yet` before the user generates a preview.
- When preview data exists, show:
  - Note banner stating the rules are illustrative example rules.
  - Rules table: `Go long`, optional `Short condition (example)` row when `hasShort` is true, `Risk`, `Timeframe`, and `Pairs`.
  - `Review the assumptions` warning box with `Remove short example` button when `hasShort` is true. Clicking `Remove short example` hides the short row and shows an 8-second toast with `Undo`.
  - Collapsible `Strategy definition (JSON)` section with `Show` / `Hide` button (`aria-expanded`) and `Copy` button (`navigator.clipboard.writeText`, toast `Strategy JSON copied to the clipboard.`).

- [ ] **Step 2: Create `StrategySaveCard.tsx` and `RecentLibraryCard.tsx`**

Create `apps/web/app/pages/StrategyEngine/components/StrategySaveCard.tsx`:

- Show `Awaiting a strategy preview` empty card before a preview exists.
- When preview exists, show:
  - Status box `Example validation checks.` with `Show checks` / `Hide checks` toggle listing `Required fields`, `Logic`, and `Indicators`.
  - `Name` text input (`maxLength={60}`) with inline validation error when blank or duplicate.
  - Read-only `Version` `<output>` showing `1.0.0 auto` for a new strategy or `{nextVersion} on save` while editing.
  - `Tags` chip list: each chip has a delete button (`aria-label="Remove tag {tag}"`) that shows an 8-second Undo toast, plus an `Add tag` text input that adds trimmed tags on `Enter`.
  - Read-only `Source` readout (`Written by you` or `Imported from a link`).
  - Primary submit button `Save strategy` (or `Save changes` when editing), disabled while mutation is pending.

Create `apps/web/app/pages/StrategyEngine/components/RecentLibraryCard.tsx`:

- Show heading `Your library`, subtitle `Most recently saved`, and link `View all ({totalCount})` pointing to `/library`.
- Show loading `Skeleton` while `useStrategyList` loads.
- Show error `Alert` with `Retry` button when `useStrategyList` fails.
- Show empty message `Nothing saved yet. Preview the rules above, then save to add your first strategy.` when list is empty.
- Show up to 3 most recently saved items with columns `Name`, `Type`, `Source`, `Updated`, `Version`, `Tags`, `Last backtest`, and row links `Backtest` (`/backtest?strategy={id}`) and `Open` (`/library?open={id}`).

- [ ] **Step 3: Create `StrategyEnginePage.tsx` and wire `apps/web/app/routes/strategy.tsx`**

Create `apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx`:

- Render `<h1 className="text-3xl font-semibold tracking-tight">Strategy Engine</h1>` and link `Strategy library ({totalCount})` to `/library`.
- Read `?edit=<id>` from `useSearchParams()` to load an existing strategy from `useStrategyList()` into edit mode (pre-filling input mode, prompt/URL, tags, name, `hasShort`, and opening preview automatically).
- Read initial draft with `readStrategyDraft(window.localStorage)` when matching the active context (`editId`). Show banner `Restored your unsaved changes from {savedAt}.` with `Discard draft` and `Keep` buttons.
- Sync edits to browser storage through `useStrategyDraftSync`.
- When editing an item, show status banner `Editing {name} Â· v{version}. Saving updates this strategy in your library. Past backtest runs keep the configuration they ran with.` and `Stop editing` button.
- If edits are clean, `Stop editing` clears the draft and navigates to `/library`. If edits are dirty, `Stop editing` opens a `Dialog` titled `Discard changes to {name}?` with `Keep editing` and `Discard changes` (clears draft and navigates to `/library`).
- On `Save strategy` / `Save changes`:
  - Call `createStrategy` or `updateStrategy`.
  - Clear the browser draft, enter edit mode for the saved item, and show a Sonner toast with action `Backtest it` navigating to `/backtest?strategy={saved.id}` (carrying `{ from: 'Strategy Engine' }` in router state).

Update `apps/web/app/routes/strategy.tsx` to render `<StrategyEnginePage />` instead of `<ScreenPlaceholder title="Strategy Engine" />`.

- [ ] **Step 4: Run typecheck, lint, tests, and prettier**

Run: `pnpm --filter @crypto-force/web typecheck && pnpm --filter @crypto-force/web test && pnpm exec eslint apps/web/app/routes/strategy.tsx apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx apps/web/app/pages/StrategyEngine/components/StrategyInputCard.tsx apps/web/app/pages/StrategyEngine/components/StrategyPreviewCard.tsx apps/web/app/pages/StrategyEngine/components/StrategySaveCard.tsx apps/web/app/pages/StrategyEngine/components/RecentLibraryCard.tsx && pnpm exec prettier --check apps/web/app/routes/strategy.tsx apps/web/app/pages/StrategyEngine/StrategyEnginePage.tsx apps/web/app/pages/StrategyEngine/components/StrategyInputCard.tsx apps/web/app/pages/StrategyEngine/components/StrategyPreviewCard.tsx apps/web/app/pages/StrategyEngine/components/StrategySaveCard.tsx apps/web/app/pages/StrategyEngine/components/RecentLibraryCard.tsx`
Expected: PASS. Typecheck exits with code 0, Vitest passes, ESLint exits with code 0, and Prettier reports all files formatted.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-03-strategy-engine-screen.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-03-strategy-engine-screen.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-03-strategy-engine-screen.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-03-strategy-engine-screen.md`.
5. Mark Step 5 as `- [x]`, stop, and send the report summary.
