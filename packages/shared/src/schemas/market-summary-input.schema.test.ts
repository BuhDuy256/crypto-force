// Checks the approved summary-query schema through package exports. No I/O or doubles.
// Run the shared Vitest suite. Expected: REST summary accepts only pair.
// The schema export is missing. These cases cannot reach assertions until Step 08 adds it.
import * as shared from '@crypto-force/shared';
import { expect, it } from 'vitest';

it.each(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'])('accepts summary pair %s', (pair) => {
  expect(shared.marketSummaryInputSchema.safeParse({ pair }).success).toBe(true);
});
it.each([
  { pair: 'BTCUSDT', timeframe: '1m' },
  { pair: 'BTCUSDT', limit: 1 },
  {},
  { pair: ['BTCUSDT', 'ETHUSDT'] },
])('rejects summary query %j', (query) => {
  expect(shared.marketSummaryInputSchema.safeParse(query).success).toBe(false);
});
