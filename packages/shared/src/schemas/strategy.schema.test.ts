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
