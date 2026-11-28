# Task 2: Web API Clients, Hooks, Draft Helpers, and Dialog Primitives

Read this file to learn Task 2 steps, which add HTTP clients, query hooks, draft helpers, and Dialog and Badge primitives.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `apps/web/app/api/market-data.ts` (lines 1-82)
- `apps/web/app/components/ui/sheet.tsx` (lines 1-60)
- `packages/shared/src/schemas/strategy.schema.ts` (lines 1-140)
- `packages/shared/src/schemas/backtest.schema.ts` (lines 1-160)
- `.agents/skills/tdd/SKILL.md`

**Files:**

- Create: `apps/web/app/api/strategies.ts`
- Create: `apps/web/app/api/backtest.ts`
- Create: `apps/web/app/utils/strategy-draft.ts`
- Test: `apps/web/app/utils/strategy-draft.test.ts`
- Create: `apps/web/app/hooks/useStrategies.ts`
- Create: `apps/web/app/hooks/useBacktests.ts`
- Create: `apps/web/app/components/ui/dialog.tsx`
- Create: `apps/web/app/components/ui/badge.tsx`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-02-web-api-hooks-and-primitives.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-02-web-api-hooks-and-primitives.md`

**Interfaces:**

- Uses from `@crypto-force/shared`:
  - `strategyPreviewRequestSchema`, `strategyPreviewResponseSchema`, `strategyLibraryItemSchema`, `strategyListResponseSchema`, `createStrategyInputSchema`, `updateStrategyInputSchema`, `renameStrategyInputSchema`
  - `createBacktestInputSchema`, `backtestRunSchema`, `backtestRunDetailSchema`, `backtestRunListResponseSchema`, `activeBacktestResponseSchema`, `backtestConflictErrorSchema`
- Produces in `apps/web/app/api/strategies.ts`:
  - `export class StrategyApiError extends Error { constructor(readonly code: string, message: string, readonly status: number) }`
  - `export async function previewStrategy(input: StrategyPreviewRequest, signal?: AbortSignal): Promise<StrategyPreviewResponse>`
  - `export async function listStrategies(filters?: { kind?: 'all' | 'strategy' | 'composite'; q?: string }, signal?: AbortSignal): Promise<StrategyListResponse>`
  - `export async function createStrategy(input: CreateStrategyInput): Promise<StrategyLibraryItem>`
  - `export async function updateStrategy(id: string, input: UpdateStrategyInput): Promise<StrategyLibraryItem>`
  - `export async function renameStrategy(id: string, input: RenameStrategyInput): Promise<StrategyLibraryItem>`
  - `export async function duplicateStrategy(id: string): Promise<StrategyLibraryItem>`
  - `export async function deleteStrategy(id: string): Promise<{ deletedId: string }>`
  - `export async function restoreStrategy(id: string): Promise<StrategyLibraryItem>`
- Produces in `apps/web/app/api/backtest.ts`:
  - `export class BacktestApiError extends Error { constructor(readonly code: string, message: string, readonly status: number, readonly activeRun?: BacktestRun) }`
  - `export async function listBacktestRuns(signal?: AbortSignal): Promise<BacktestRunListResponse>`
  - `export async function getActiveBacktest(signal?: AbortSignal): Promise<ActiveBacktestResponse>`
  - `export async function getBacktestRun(id: string, signal?: AbortSignal): Promise<BacktestRunDetail>`
  - `export async function createBacktestRun(input: CreateBacktestInput): Promise<BacktestRun>`
  - `export async function cancelBacktestRun(id: string): Promise<BacktestRun>`
- Produces in `apps/web/app/utils/strategy-draft.ts`:
  - `export interface StrategyDraftSnapshot { editId: string | null; inputMode: 'prompt' | 'url'; prompt: string; url: string; tags: string[]; saveName: string; hasShort: boolean; savedAt: string }`
  - `export function readStrategyDraft(storage: Pick<Storage, 'getItem'>): StrategyDraftSnapshot | null`
  - `export function writeStrategyDraft(storage: Pick<Storage, 'setItem'>, draft: StrategyDraftSnapshot): void`
  - `export function clearStrategyDraft(storage: Pick<Storage, 'removeItem'>): void`
  - `export function isStrategyDraftDirty(current: Omit<StrategyDraftSnapshot, 'savedAt'>, baseline: Omit<StrategyDraftSnapshot, 'savedAt'>): boolean`
  - `export function bumpPatchVersion(version: string): string`
  - `export function formatBacktestPeriod(from: string, to: string): string | null`
  - `export function isDateAfterToday(isoDate: string, todayIsoDate: string): boolean`
- Produces in `apps/web/app/hooks/useStrategies.ts`:
  - `useStrategyList`, `usePreviewStrategy`, `useCreateStrategy`, `useUpdateStrategy`, `useRenameStrategy`, `useDuplicateStrategy`, `useDeleteStrategy`, `useRestoreStrategy`, `useStrategyDraftSync`
- Produces in `apps/web/app/hooks/useBacktests.ts`:
  - `useBacktestRuns`, `useActiveBacktest`, `useBacktestRunDetail`, `useCreateBacktest`, `useCancelBacktest`
- Produces in `apps/web/app/components/ui/`:
  - `dialog.tsx`: `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`
  - `badge.tsx`: `Badge`

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Import `useEffect` or `useLayoutEffect` outside `apps/web/app/hooks/`.
- Import `~/api/` inside `apps/web/app/components/`, `apps/web/app/layouts/`, or `apps/web/app/pages/`.
- Import `mocks/` or `msw` inside `apps/web/app/`.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Commit or push.

- [x] **Step 1: Write failing unit tests for draft and period helpers**

Create `apps/web/app/utils/strategy-draft.test.ts` with this code:

```ts
import { describe, expect, it } from 'vitest';
import {
  bumpPatchVersion,
  clearStrategyDraft,
  formatBacktestPeriod,
  isDateAfterToday,
  isStrategyDraftDirty,
  readStrategyDraft,
  writeStrategyDraft,
} from './strategy-draft';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe('strategy draft and backtest date helpers', () => {
  it('writes, reads, and clears a valid browser draft and rejects malformed JSON', () => {
    const storage = createMemoryStorage();
    const draft = {
      editId: null,
      inputMode: 'prompt' as const,
      prompt: 'Buy when RSI < 30',
      url: 'https://www.tradingview.com/script/abc/',
      tags: ['RSI', 'Long'],
      saveName: 'RSI_LONG',
      hasShort: true,
      savedAt: '14:25',
    };

    writeStrategyDraft(storage, draft);
    expect(readStrategyDraft(storage)).toEqual(draft);

    clearStrategyDraft(storage);
    expect(readStrategyDraft(storage)).toBeNull();

    storage.setItem('cf.draftStrategy', '{bad-json');
    expect(readStrategyDraft(storage)).toBeNull();
  });

  it('detects dirty edits and increments patch versions', () => {
    const base = {
      editId: 'st-1',
      inputMode: 'prompt' as const,
      prompt: 'Original prompt',
      url: '',
      tags: ['RSI'],
      saveName: 'MyStrategy',
      hasShort: true,
    };
    expect(isStrategyDraftDirty(base, { ...base, tags: ['RSI'] })).toBe(false);
    expect(isStrategyDraftDirty({ ...base, hasShort: false }, base)).toBe(true);
    expect(bumpPatchVersion('1.0.0')).toBe('1.0.1');
    expect(bumpPatchVersion('1.2.9')).toBe('1.2.10');
  });

  it('formats valid backtest periods and detects future end dates', () => {
    expect(formatBacktestPeriod('2025-05-01', '2025-05-15')).toBe(
      '01 May 2025 -> 15 May 2025 Â· 14 days',
    );
    expect(formatBacktestPeriod('2025-05-15', '2025-05-01')).toBeNull();
    expect(isDateAfterToday('2026-11-26', '2026-11-25')).toBe(true);
    expect(isDateAfterToday('2026-11-25', '2026-11-25')).toBe(false);
  });
});
```

- [x] **Step 2: Run the unit test and check that it fails**

Run: `pnpm --filter @crypto-force/web test`
Expected: FAIL. The output reports missing module `./strategy-draft`.

- [x] **Step 3: Implement draft helpers, typed HTTP clients, and hooks**

Create `apps/web/app/utils/strategy-draft.ts`:

- Use storage key `'cf.draftStrategy'`.
- Check parsed draft payload with Zod in `readStrategyDraft`. Return `null` on invalid JSON or schema mismatch.
- Format dates with English short months (`Jan`..`Dec`) and inclusive day delta in `formatBacktestPeriod`. Return `null` when `from >= to` or when either date is invalid.

Create `apps/web/app/api/strategies.ts`:

- Send `fetch` requests to `/api/strategies/preview`, `/api/strategies`, `/api/strategies/:id`, `/api/strategies/:id/rename`, `/api/strategies/:id/duplicate`, `/api/strategies/:id/restore`.
- Parse non-OK JSON bodies for `{ error: { code, message } }` and throw `StrategyApiError`.
- Parse every successful response with the corresponding `@crypto-force/shared` schema. Throw `StrategyApiError('INVALID_RESPONSE', 'Unexpected server response.', response.status)` on schema mismatch.

Create `apps/web/app/api/backtest.ts`:

- Send `fetch` requests to `/api/backtests`, `/api/backtests/active`, `/api/backtests/:id`, `/api/backtests/:id/cancel`.
- When `POST /api/backtests` returns `409`, parse with `backtestConflictErrorSchema` and throw `BacktestApiError('BACKTEST_ALREADY_RUNNING', parsed.error.message, 409, parsed.activeRun)`.
- Parse every successful response with `@crypto-force/shared` schemas.

Create `apps/web/app/hooks/useStrategies.ts`:

- Export query key helpers (`strategyKeys`) and TanStack Query hooks for all strategy endpoints.
- Invalidate `strategyKeys.all` after create, update, rename, duplicate, delete, and restore mutations.
- Export `useStrategyDraftSync({ current, baseline, enabled })` that runs `useEffect` to write or clear `window.localStorage` whenever `current` changes.

Create `apps/web/app/hooks/useBacktests.ts`:

- Export `useBacktestRuns()`, `useActiveBacktest()`, `useBacktestRunDetail(id)`, `useCreateBacktest()`, `useCancelBacktest()`.
- In `useActiveBacktest()`: set `retry: false` and `refetchInterval: (query) => (query.state.data?.run ? 1000 : false)`. When `/api/backtests/active` returns `404` (real API before Phase 5), return `{ run: null }` instead of throwing so existing workspace routes stay quiet.
- In `useBacktestRuns()` and `useBacktestRunDetail(id)`: set `refetchInterval: 1000` only while a returned run has `status === 'running'`.
- Invalidate backtest query keys after create and cancel mutations.

- [x] **Step 4: Create Dialog and Badge UI primitives**

Create `apps/web/app/components/ui/dialog.tsx` using `import { Dialog as DialogPrimitive } from 'radix-ui'` and `cn` from `~/utils/cn`, matching the visual tokens in `apps/web/app/components/ui/sheet.tsx`.
Create `apps/web/app/components/ui/badge.tsx` using `class-variance-authority` and `cn` from `~/utils/cn` with variants `default`, `secondary`, `outline`, `success`, `warning`, `destructive`, and `info`.

- [x] **Step 5: Run tests, typecheck, lint, and prettier**

Run: `pnpm --filter @crypto-force/web test && pnpm --filter @crypto-force/web typecheck && pnpm exec eslint apps/web/app/api/strategies.ts apps/web/app/api/backtest.ts apps/web/app/utils/strategy-draft.ts apps/web/app/utils/strategy-draft.test.ts apps/web/app/hooks/useStrategies.ts apps/web/app/hooks/useBacktests.ts apps/web/app/components/ui/dialog.tsx apps/web/app/components/ui/badge.tsx && pnpm exec prettier --check apps/web/app/api/strategies.ts apps/web/app/api/backtest.ts apps/web/app/utils/strategy-draft.ts apps/web/app/utils/strategy-draft.test.ts apps/web/app/hooks/useStrategies.ts apps/web/app/hooks/useBacktests.ts apps/web/app/components/ui/dialog.tsx apps/web/app/components/ui/badge.tsx`
Expected: PASS. Vitest passes all tests, typecheck exits with code 0, ESLint exits with code 0, and Prettier reports all files formatted.

- [x] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-02-web-api-hooks-and-primitives.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-02-web-api-hooks-and-primitives.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-02-web-api-hooks-and-primitives.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-02-web-api-hooks-and-primitives.md`.
5. Mark Step 6 as `- [x]`, stop, and send the report summary.
