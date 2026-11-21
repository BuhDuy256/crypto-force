import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Synthetic input and oracle. Integer arithmetic is independent of the production mapper.
const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const intervals = {
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1h': 3600000,
  '4h': 14400000,
  '1d': 86400000,
};
const fixture = {
  version: 1,
  seed: 20261121,
  epoch: 1735689600000,
  source: 'Synthetic benchmark fixture. Values are not market prices.',
  keys: {},
};
for (const [pairIndex, pair] of pairs.entries()) {
  for (const [timeframe, step] of Object.entries(intervals)) {
    const raw = [];
    const candles = [];
    const ma20 = [];
    for (let index = 0; index < 519; index++) {
      const openTime = fixture.epoch + index * step;
      const base = 10000 * (pairIndex + 1) + index * 10;
      raw.push([
        openTime,
        String(base),
        String(base + 8),
        String(base - 4),
        String(base + 4),
        String(index + 1),
        openTime + step - 1,
        '0',
        1,
        '0',
        '0',
        '0',
      ]);
      candles.push({
        openTime,
        open: base,
        high: base + 8,
        low: base - 4,
        close: base + 4,
        volume: index + 1,
        isClosed: true,
      });
      if (index >= 19) ma20.push({ time: openTime / 1000, value: base - 91 });
    }
    fixture.keys[`${pair}:${timeframe}`] = { raw, candles, ma20 };
  }
  fixture.keys[`summary:${pair}`] = {
    raw: {
      symbol: pair,
      lastPrice: String(10000 * (pairIndex + 1) + 5184),
      priceChangePercent: '-1.25',
    },
    expected: { pair, lastPrice: 10000 * (pairIndex + 1) + 5184, change24hPercent: -1.25 },
  };
}
const directory = fileURLToPath(new URL('./fixtures/', import.meta.url));
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/replay.json`, JSON.stringify(fixture));
