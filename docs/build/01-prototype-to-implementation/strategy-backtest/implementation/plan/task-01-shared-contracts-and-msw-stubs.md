# Task 1: Shared Strategy and Backtest Contracts and MSW Stubs

Read this file to learn Task 1 steps, which add shared Zod contracts and MSW handlers for Strategy and Backtest.

**Read first:**

- [Global Constraints](../README.md#global-constraints) in `../README.md`
- `packages/shared/src/index.ts` (lines 1-41)
- `packages/shared/src/schemas/market-data.schema.ts` (lines 1-60)
- `apps/web/mocks/handlers.ts` (lines 1-4)
- `apps/web/mocks/market-data.handlers.ts` (lines 1-20)
- `apps/web/mocks/market-data.test.ts` (lines 1-29)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**

- Create: `packages/shared/src/schemas/strategy.schema.ts`
- Test: `packages/shared/src/schemas/strategy.schema.test.ts`
- Create: `packages/shared/src/schemas/backtest.schema.ts`
- Test: `packages/shared/src/schemas/backtest.schema.test.ts`
- Change: `packages/shared/src/index.ts` (lines 1-41)
- Create: `apps/web/mocks/fixtures/strategy-backtest.ts`
- Create: `apps/web/mocks/strategy.handlers.ts`
- Create: `apps/web/mocks/backtest.handlers.ts`
- Change: `apps/web/mocks/handlers.ts` (lines 1-4)
- Test: `apps/web/mocks/strategy-backtest.test.ts`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`
- Change: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-01-shared-contracts-and-msw-stubs.md`
- Create: `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-01-shared-contracts-and-msw-stubs.md`

**Interfaces:**

- Uses from `packages/shared/src/schemas/market-data.schema.ts`:
  - `marketPairSchema`, `type MarketPair`
- Produces in `packages/shared/src/schemas/strategy.schema.ts` (re-exported by `packages/shared/src/index.ts`):
  - `strategyKindSchema`, `strategyInputModeSchema`, `strategySourceSchema`
  - `strategyValidationCheckSchema`, `strategyPreviewRequestSchema`, `strategyPreviewResponseSchema`
  - `strategyLibraryItemSchema`, `strategyListResponseSchema`
  - `createStrategyInputSchema`, `updateStrategyInputSchema`, `renameStrategyInputSchema`
  - Types: `StrategyKind`, `StrategyInputMode`, `StrategySource`, `StrategyValidationCheck`, `StrategyPreviewRequest`, `StrategyPreviewResponse`, `StrategyLibraryItem`, `StrategyListResponse`, `CreateStrategyInput`, `UpdateStrategyInput`, `RenameStrategyInput`
- Produces in `packages/shared/src/schemas/backtest.schema.ts` (re-exported by `packages/shared/src/index.ts`):
  - `backtestTimeframeSchema`, `backtestRunStatusSchema`, `backtestTradeSideSchema`
  - `createBacktestInputSchema`, `backtestTradeSchema`, `backtestEquityPointSchema`, `backtestPriceCandleSchema`, `backtestResultSummarySchema`
  - `backtestRunSchema`, `backtestRunDetailSchema`, `backtestRunListResponseSchema`, `activeBacktestResponseSchema`, `backtestConflictErrorSchema`
  - Types: `BacktestTimeframe`, `BacktestRunStatus`, `BacktestTradeSide`, `CreateBacktestInput`, `BacktestTrade`, `BacktestEquityPoint`, `BacktestPriceCandle`, `BacktestResultSummary`, `BacktestRun`, `BacktestRunDetail`, `BacktestRunListResponse`, `ActiveBacktestResponse`, `BacktestConflictError`
- Produces in `apps/web/mocks/`:
  - `apps/web/mocks/fixtures/strategy-backtest.ts`: `seedStrategyLibrary()`, `seedBacktestRuns()`, `createMockRunResult()`, `buildStrategyPreview(inputMode, includeShort)`
  - `apps/web/mocks/strategy.handlers.ts`: `strategyHandlers`, `resetMockStrategyStore()`
  - `apps/web/mocks/backtest.handlers.ts`: `backtestHandlers`, `resetMockBacktestStore()`

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- This task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip, or weaken a test or a check.
- Add a lint-disable directive, `@ts-expect-error`, or warning comment.
- Import `apps/web/mocks/` or `msw` from `apps/web/app/`.
- Commit or push.

- [x] **Step 1: Write failing unit tests for strategy and backtest schemas**

Create `packages/shared/src/schemas/strategy.schema.test.ts` with this code:

```ts
import { describe, expect, it } from 'vitest';
import {
  createStrategyInputSchema,
  renameStrategyInputSchema,
  strategyPreviewRequestSchema,
} from './strategy.schema';

describe('strategy schemas', () => {
  it('accepts a valid prompt preview request and rejects blank or overlong prompts', () => {
    expect(
      strategyPreviewRequestSchema.safeParse({
        inputMode: 'prompt',
        prompt: 'Go LONG when RSI is below 30. Stop loss 2%, take profit 4%.',
      }).success,
    ).toBe(true);
    expect(
      strategyPreviewRequestSchema.safeParse({
        inputMode: 'prompt',
        prompt: '   ',
      }).success,
    ).toBe(false);
    expect(
      strategyPreviewRequestSchema.safeParse({
        inputMode: 'prompt',
        prompt: 'a'.repeat(1001),
      }).success,
    ).toBe(false);
  });

  it('accepts a valid http or https strategy URL and rejects non-URL input', () => {
    expect(
      strategyPreviewRequestSchema.safeParse({
        inputMode: 'url',
        url: 'https://www.tradingview.com/script/abc123/',
      }).success,
    ).toBe(true);
    expect(
      strategyPreviewRequestSchema.safeParse({
        inputMode: 'url',
        url: 'ftp://example.com/strategy',
      }).success,
    ).toBe(false);
    expect(
      strategyPreviewRequestSchema.safeParse({
        inputMode: 'url',
        url: 'not-a-link',
      }).success,
    ).toBe(false);
  });

  it('validates strategy name length up to 60 characters on create and rename', () => {
    const base = {
      name: 'RSI_BB_LB_LONG_SL2_TP4',
      inputMode: 'prompt' as const,
      prompt: 'When RSI < 30 go LONG.',
      url: null,
      tags: ['RSI', 'Long'],
      includeShortExample: true,
      rules: ['LONG when RSI(14) is below 30'],
    };
    expect(createStrategyInputSchema.safeParse(base).success).toBe(true);
    expect(createStrategyInputSchema.safeParse({ ...base, name: '   ' }).success).toBe(false);
    expect(createStrategyInputSchema.safeParse({ ...base, name: 'x'.repeat(61) }).success).toBe(
      false,
    );
    expect(renameStrategyInputSchema.safeParse({ name: 'x'.repeat(60) }).success).toBe(true);
    expect(renameStrategyInputSchema.safeParse({ name: 'x'.repeat(61) }).success).toBe(false);
  });
});
```

Create `packages/shared/src/schemas/backtest.schema.test.ts` with this code:

```ts
import { describe, expect, it } from 'vitest';
import { createBacktestInputSchema } from './backtest.schema';

describe('backtest schemas', () => {
  const validInput = {
    pair: 'BTCUSDT' as const,
    timeframe: '5m' as const,
    from: '2025-05-01',
    to: '2025-05-15',
    capitalUsd: 100,
    strategyName: 'MA Crossover',
    strategyId: null,
    feePercent: 0.08,
    slippageBps: 5,
  };

  it('accepts a valid manual backtest setup', () => {
    expect(createBacktestInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects end dates on or before start date', () => {
    expect(createBacktestInputSchema.safeParse({ ...validInput, to: '2025-05-01' }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, to: '2025-04-30' }).success).toBe(
      false,
    );
  });

  it('enforces numeric bounds for capital, fee percent, and integer slippage bps', () => {
    expect(createBacktestInputSchema.safeParse({ ...validInput, capitalUsd: 0.99 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, feePercent: -0.01 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, feePercent: 1.01 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, slippageBps: -1 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, slippageBps: 101 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, slippageBps: 2.5 }).success).toBe(
      false,
    );
  });
});
```

- [x] **Step 2: Run the shared schema tests and check that they fail**

Run: `pnpm --filter @crypto-force/shared test`
Expected: FAIL. The output reports missing modules `./strategy.schema` and `./backtest.schema`.

- [x] **Step 3: Implement shared strategy and backtest schemas and export them**

Create `packages/shared/src/schemas/strategy.schema.ts` with the exact schemas and types listed in `Interfaces`:

- `strategyKindSchema = z.enum(['strategy', 'composite'])`
- `strategyInputModeSchema = z.enum(['prompt', 'url'])`
- `strategySourceSchema = z.enum(['Written by you', 'Imported from a link', 'Built in Discovery'])`
- `strategyValidationCheckSchema = z.strictObject({ title: z.string().min(1), detail: z.string().min(1), passed: z.boolean() })`
- `strategyPreviewRequestSchema = z.discriminatedUnion('inputMode', [...])`:
  - `inputMode: 'prompt'` requires `prompt` trimmed length `1..1000`
  - `inputMode: 'url'` requires `url` matching `/^https?:\/\/[^\s/]+\.[^\s/]+/`
- `strategyPreviewResponseSchema = z.strictObject({ inputMode, source, rules: z.array(z.string().min(1)).min(1), hasShortExample: z.boolean(), shortRuleText: z.string().min(1), riskSummary: z.string().min(1), assumedTimeframe: z.string().min(1), assumedPairs: z.string().min(1), assumptions: z.array(z.string().min(1)), definitionJson: z.string().min(2), checks: z.array(strategyValidationCheckSchema).min(1) })`
- `strategyLibraryItemSchema = z.strictObject({ id: z.string().min(1), kind: strategyKindSchema, name: z.string().trim().min(1).max(60), source: strategySourceSchema, inputMode: strategyInputModeSchema.nullable(), prompt: z.string().nullable(), url: z.string().nullable(), tags: z.array(z.string().trim().min(1).max(32)), version: z.string().regex(/^\d+\.\d+\.\d+$/), createdAt: z.string().min(1), updatedAt: z.string().min(1), rules: z.array(z.string().min(1)).min(1), blocks: z.array(z.string().min(1)).nullable(), voteMethod: z.enum(['majority', 'weighted']).nullable(), weights: z.array(z.number().nonnegative()).nullable(), lastRunSummary: z.string().nullable() })`
- `createStrategyInputSchema` and `updateStrategyInputSchema`: `name` trimmed `1..60`, `inputMode`, `prompt` nullable, `url` nullable, `tags`, `includeShortExample: z.boolean()`, `rules: z.array(z.string().min(1)).min(1)`.
- `renameStrategyInputSchema = z.strictObject({ name: z.string().trim().min(1).max(60) })`
- `strategyListResponseSchema = z.strictObject({ items: z.array(strategyLibraryItemSchema), totalCount: z.number().int().nonnegative() })`

Create `packages/shared/src/schemas/backtest.schema.ts` with the exact schemas and types listed in `Interfaces`:

- `backtestTimeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h'])`
- `backtestRunStatusSchema = z.enum(['running', 'completed', 'failed', 'cancelled'])`
- `backtestTradeSideSchema = z.enum(['LONG', 'SHORT'])`
- `isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
- `createBacktestInputSchema = z.strictObject({ pair: marketPairSchema, timeframe: backtestTimeframeSchema, from: isoDateSchema, to: isoDateSchema, capitalUsd: z.number().min(1), strategyName: z.string().trim().min(1).max(80), strategyId: z.string().min(1).nullable(), feePercent: z.number().min(0).max(1), slippageBps: z.number().int().min(0).max(100), unsavedRules: z.array(z.string().min(1)).optional() }).refine((v) => v.to > v.from, { path: ['to'], message: 'End date must be after the start date.' })`
- `backtestTradeSchema`: `index: z.number().int().positive()`, `openedAt: z.string().min(1)`, `openedTimeSec: z.number().int().positive()`, `closedTimeSec: z.number().int().positive()`, `side: backtestTradeSideSchema`, `pnlUsd: z.number()`, `pnlPercent: z.number()`, `entryPrice: z.number().positive()`, `exitPrice: z.number().positive()`, `stopLoss: z.number().positive()`, `takeProfit: z.number().positive()`, `feeUsd: z.number().nonnegative()`, `slippageUsd: z.number().nonnegative()`, `heldDuration: z.string().min(1)`.
- `backtestEquityPointSchema`: `timeSec: z.number().int().positive()`, `accountValueUsd: z.number().nonnegative()`, `buyAndHoldUsd: z.number().nonnegative()`, `drawdownUsd: z.number().nonpositive()`.
- `backtestPriceCandleSchema`: `timeSec: z.number().int().positive()`, `open: z.number().positive()`, `high: z.number().positive()`, `low: z.number().positive()`, `close: z.number().positive()`, `volume: z.number().nonnegative()`, `ma20: z.number().positive().nullable()`, `ma50: z.number().positive().nullable()`.
- `backtestResultSummarySchema`: `netReturnUsd`, `netReturnPercent`, `maxDrawdownUsd`, `maxDrawdownPercent`, `winRatePercent`, `winningTrades`, `totalTrades`, `avgNetPerTradeUsd`, `avgCostPerTradeUsd`, `buyAndHoldPercent`, `vsBuyAndHoldPts`, `grossPnlUsd`, `totalFeeUsd`, `totalSlippageUsd`, `netPnlUsd`, `costShareOfGrossPercent`, `supportLevel`, `resistanceLevel`, `assumptions: z.array(z.string().min(1))`, `equityCurve: z.array(backtestEquityPointSchema).min(2)`, `priceSeries: z.array(backtestPriceCandleSchema).min(2)`, `trades: z.array(backtestTradeSchema)`.
- `backtestRunSchema`: `id`, `status`, `progressPercent` (`0..100`), `strategyId: z.string().nullable()`, `strategyName`, `strategyVersion`, `strategyKind: z.enum(['builtin', 'strategy', 'composite'])`, `rules: z.array(z.string().min(1)).min(1)`, `pair: marketPairSchema`, `timeframe: backtestTimeframeSchema`, `from: isoDateSchema`, `to: isoDateSchema`, `capitalUsd: z.number().min(1)`, `feePercent: z.number().min(0).max(1)`, `slippageBps: z.number().int().min(0).max(100)`, `startedAt: z.string().min(1)`, `endedAt: z.string().nullable()`, `resultLabel: z.string().min(1)`, `failureReason: z.string().nullable()`.
- `backtestRunDetailSchema`: extends `backtestRunSchema` with `drift: z.strictObject({ deletedFromLibrary: z.boolean(), currentName: z.string().nullable(), currentVersion: z.string().nullable() })` and `result: backtestResultSummarySchema.nullable()`.
- `backtestRunListResponseSchema = z.strictObject({ runs: z.array(backtestRunSchema) })`
- `activeBacktestResponseSchema = z.strictObject({ run: backtestRunSchema.nullable() })`
- `backtestConflictErrorSchema = z.strictObject({ error: z.strictObject({ code: z.literal('BACKTEST_ALREADY_RUNNING'), message: z.string().min(1) }), activeRun: backtestRunSchema })`

Update `packages/shared/src/index.ts` to re-export every schema and type from `./schemas/strategy.schema` and `./schemas/backtest.schema`.

- [x] **Step 4: Run shared schema tests and typecheck**

Run: `pnpm --filter @crypto-force/shared test && pnpm --filter @crypto-force/shared typecheck`
Expected: PASS. Vitest reports all tests passed and `tsc --noEmit` exits with code 0.

- [x] **Step 5: Write failing fixture and MSW contract test**

Create `apps/web/mocks/strategy-backtest.test.ts` with this code:

```ts
import {
  backtestRunDetailSchema,
  backtestRunListResponseSchema,
  strategyListResponseSchema,
  strategyPreviewResponseSchema,
} from '@crypto-force/shared';
import { describe, expect, it } from 'vitest';
import {
  buildStrategyPreview,
  createMockRunResult,
  seedBacktestRuns,
  seedStrategyLibrary,
} from './fixtures/strategy-backtest';

describe('strategy and backtest development fixtures', () => {
  it('produces schema-valid strategy previews and library items', () => {
    const promptPreview = buildStrategyPreview('prompt', true);
    expect(strategyPreviewResponseSchema.safeParse(promptPreview).success).toBe(true);
    expect(promptPreview.hasShortExample).toBe(true);

    const longOnlyPreview = buildStrategyPreview('url', false);
    expect(strategyPreviewResponseSchema.safeParse(longOnlyPreview).success).toBe(true);
    expect(longOnlyPreview.hasShortExample).toBe(false);

    const items = seedStrategyLibrary();
    expect(
      strategyListResponseSchema.safeParse({ items, totalCount: items.length }).success,
    ).toBe(true);
    expect(items.length).toBe(3);
  });

  it('produces schema-valid backtest runs and preserves P/L accounting invariance', () => {
    const runs = seedBacktestRuns();
    expect(backtestRunListResponseSchema.safeParse({ runs }).success).toBe(true);
    expect(runs.map((run) => run.status)).toEqual(['completed', 'failed', 'cancelled']);

    const result = createMockRunResult(0.08, 5);
    expect(result.grossPnlUsd - result.totalFeeUsd - result.totalSlippageUsd).toBeCloseTo(
      result.netPnlUsd,
      6,
    );
    const completedRun = runs[0];
    expect(completedRun).toBeDefined();
    const detail = {
      ...completedRun,
      drift: { deletedFromLibrary: false, currentName: null, currentVersion: null },
      result,
    };
    expect(backtestRunDetailSchema.safeParse(detail).success).toBe(true);
  });
});
```

- [x] **Step 6: Run the web fixture test and check that it fails**

Run: `pnpm --filter @crypto-force/web test`
Expected: FAIL. The output reports missing module `./fixtures/strategy-backtest`.

- [x] **Step 7: Implement fixtures and stateful MSW handlers**

Create `apps/web/mocks/fixtures/strategy-backtest.ts`:

- `seedStrategyLibrary()` returns 3 items matching `docs/design/prototype/screens/Library.dc.html`: `st-rsi-bb` (`RSI_BB_LB_LONG_SL2_TP4`, `1.0.0`, `Written by you`), `st-macd` (`MACD_Cross_TrendFollow`, `1.2.1`, `Imported from a link`), `cp-ma-rsi-sr` (`MA + RSI + S/R`, `1.0.0`, `Built in Discovery`, `composite`, `weighted` `[0.4, 0.3, 0.3]`).
- `buildStrategyPreview(inputMode, includeShort)` returns the illustrative RSI + Bollinger Bands preview matching `docs/design/prototype/screens/Strategy.dc.html`.
- `createMockRunResult(feePercent, slippageBps)` returns deterministic `BacktestResultSummary` with 30 paginated trades, 60 equity/drawdown points, 60 price/MA20/MA50 candles, `grossPnlUsd = 22.66`, `totalFeeUsd = 8.90`, `totalSlippageUsd = 5.34`, `netPnlUsd = 8.42` (exact `gross - fee - slippage = net`).
- `seedBacktestRuns()` returns 3 runs (`R-1042` completed, `R-1041` failed with SOLUSDT listing date `11 Aug 2020`, `R-1040` cancelled).

Create `apps/web/mocks/strategy.handlers.ts`:

- Hold an in-memory library array initialized from `seedStrategyLibrary()`, plus a `deletedItems` map for Undo restore.
- Export `resetMockStrategyStore()` and `readMockLibraryItems()` (used only by `backtest.handlers.ts` to compute snapshot drift).
- Register exact HTTP handlers:
  - `POST /api/strategies/preview`: parse with `strategyPreviewRequestSchema`. For `inputMode === 'url'`, succeed only when URL host matches `tradingview.com`, `medium.com`, `gist.github.com`, `blogspot.com`, or `docs.google.com`. Otherwise return `422` with `{ error: { code: 'EXTRACTION_FAILED', message: 'We could not find a strategy on that page. Check the link points to the write-up itself, or paste the text into Describe it.' } }`.
  - `GET /api/strategies`: filter by optional `kind` (`all | strategy | composite`) and `q` (name or tag substring, case-insensitive). Return `strategyListResponseSchema` payload.
  - `POST /api/strategies`: parse with `createStrategyInputSchema`. Reject duplicate name (case-insensitive) with `409` `{ error: { code: 'DUPLICATE_NAME', message: 'Your library already has that name. Enter another name.' } }`. Insert at index `0` with version `'1.0.0'`. Return `201`.
  - `PATCH /api/strategies/:id`: parse with `updateStrategyInputSchema`. Reject missing ID with `404` and duplicate name with `409`. Increment patch version (`1.0.0` -> `1.0.1`), keep list index unchanged. Return `200`.
  - `PATCH /api/strategies/:id/rename`: parse with `renameStrategyInputSchema`. Reject missing ID with `404` and duplicate name with `409`. Update `name` and `updatedAt` without changing `version` or `rules`. Return `200`.
  - `POST /api/strategies/:id/duplicate`: clone item with unique `"{name} (copy)"` suffix, version `'1.0.0'`, insert right after original. Return `201`.
  - `DELETE /api/strategies/:id`: store index and item in `deletedItems`, delete it from the list, and return `200` `{ deletedId: id }`.
  - `POST /api/strategies/:id/restore`: re-insert deleted item at saved index and return `200` with restored item.

Create `apps/web/mocks/backtest.handlers.ts`:

- Hold an in-memory runs array initialized from `seedBacktestRuns()`.
- Export `resetMockBacktestStore()` and `backtestHandlers`.
- Compute deterministic progress on each read of an active run: advance `progressPercent` by `+35` per poll (or complete at `>= 100`), setting `status` to `'failed'` when `from` precedes listing date (`BTCUSDT: '2017-08-17'`, `ETHUSDT: '2017-08-17'`, `SOLUSDT: '2020-08-11'`) and `'completed'` otherwise.
- Register exact HTTP handlers:
  - `GET /api/backtests`: advance active run and return `{ runs }`.
  - `GET /api/backtests/active`: advance active run and return `{ run: activeRun ?? null }`.
  - `GET /api/backtests/:id`: return `backtestRunDetailSchema` payload with live `drift` compared against `readMockLibraryItems()` and `result` when `status === 'completed'`. Return `404` if missing.
  - `POST /api/backtests`: parse with `createBacktestInputSchema`. If any run is currently `'running'`, return `409` matching `backtestConflictErrorSchema`. Otherwise create `R-<next>` with `status: 'running'`, `progressPercent: 15`, snapshot of strategy rules/version/name, prepend to list, and return `201`.
  - `POST /api/backtests/:id/cancel`: if run is `'running'`, transition to `'cancelled'`, set `endedAt`, clear result, and return `200` with updated run.

Update `apps/web/mocks/handlers.ts` to combine `[...marketDataHandlers, ...strategyHandlers, ...backtestHandlers]`.

- [x] **Step 8: Run tests, lint, typecheck, and prettier**

Run: `pnpm --filter @crypto-force/shared test && pnpm --filter @crypto-force/web test && pnpm --filter @crypto-force/shared typecheck && pnpm --filter @crypto-force/web typecheck && pnpm exec eslint packages/shared/src/index.ts packages/shared/src/schemas/strategy.schema.ts packages/shared/src/schemas/strategy.schema.test.ts packages/shared/src/schemas/backtest.schema.ts packages/shared/src/schemas/backtest.schema.test.ts apps/web/mocks/handlers.ts apps/web/mocks/fixtures/strategy-backtest.ts apps/web/mocks/strategy.handlers.ts apps/web/mocks/backtest.handlers.ts apps/web/mocks/strategy-backtest.test.ts && pnpm exec prettier --check packages/shared/src/index.ts packages/shared/src/schemas/strategy.schema.ts packages/shared/src/schemas/strategy.schema.test.ts packages/shared/src/schemas/backtest.schema.ts packages/shared/src/schemas/backtest.schema.test.ts apps/web/mocks/handlers.ts apps/web/mocks/fixtures/strategy-backtest.ts apps/web/mocks/strategy.handlers.ts apps/web/mocks/backtest.handlers.ts apps/web/mocks/strategy-backtest.test.ts`
Expected: PASS. All tests pass, ESLint exits with code 0, typecheck exits with code 0, and Prettier reports all files formatted.

- [x] **Step 9: Write the report file and stop**

1. Mark Steps 1 to 8 as `- [x]` in this file.
2. In `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md`, change its row status to `Done` and link `reports/task-01-shared-contracts-and-msw-stubs.md` in the `Report` column.
3. Create `docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-01-shared-contracts-and-msw-stubs.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output
   - What the commands do not prove
4. Run `pnpm exec prettier --check docs/build/01-prototype-to-implementation/strategy-backtest/implementation/README.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/task-01-shared-contracts-and-msw-stubs.md docs/build/01-prototype-to-implementation/strategy-backtest/implementation/reports/task-01-shared-contracts-and-msw-stubs.md`.
5. Mark Step 9 as `- [x]`, stop, and send the report summary.
