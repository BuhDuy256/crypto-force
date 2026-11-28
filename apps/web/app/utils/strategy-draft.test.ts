// Checks the Strategy Engine draft helpers and the Backtest period formatter.
// Runs in Vitest with an in-memory storage fake; no browser storage and no clock are needed.
// Run with `pnpm --filter @crypto-force/web test`.
// Faults run before this test passed: a no-op writeStrategyDraft (test 1), a draft reader without
// the Zod guard (test 1), a dirty check without the hasShort comparison (test 2), a formatter
// without day padding (test 3), and a formatter that accepts equal dates (test 3).
// Expected values come from the Task 2 step text and docs/design/prototype/docs/requirements/backtest.md.
// The period test keeps the task's `->` separator; the requirement shows `→`.
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
  it('writes, reads, and clears a valid browser draft and rejects a malformed or invalid draft', () => {
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

    storage.setItem('cf.draftStrategy', JSON.stringify({ ...draft, inputMode: 'invalid' }));
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
      '01 May 2025 -> 15 May 2025 · 14 days',
    );
    expect(formatBacktestPeriod('2025-05-15', '2025-05-01')).toBeNull();
    expect(formatBacktestPeriod('2025-05-15', '2025-05-15')).toBeNull();
    expect(isDateAfterToday('2026-11-26', '2026-11-25')).toBe(true);
    expect(isDateAfterToday('2026-11-25', '2026-11-25')).toBe(false);
  });
});
