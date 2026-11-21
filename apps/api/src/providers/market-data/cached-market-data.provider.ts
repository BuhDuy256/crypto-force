import type { Logger } from 'pino';
import type { MarketDataProvider } from './market-data-provider';

type CacheEntry<T> = { pending: Promise<T> } | { value: T; expiresAt: number };

export function createCachedMarketDataProvider({
  provider,
  now,
  ttlMs,
  logger,
}: {
  provider: MarketDataProvider;
  now: () => number;
  ttlMs: number;
  logger: Logger;
}): MarketDataProvider {
  const candles = new Map<
    string,
    CacheEntry<Awaited<ReturnType<MarketDataProvider['getCandles']>>>
  >();
  const summaries = new Map<
    string,
    CacheEntry<Awaited<ReturnType<MarketDataProvider['getSummary']>>>
  >();

  async function read<T>(entries: Map<string, CacheEntry<T>>, key: string, load: () => Promise<T>) {
    const entry = entries.get(key);
    if (entry && 'pending' in entry) {
      logger.debug({ key, cacheState: 'join' }, 'The request joined pending market data.');
      return entry.pending;
    }
    if (entry && now() < entry.expiresAt) {
      logger.debug({ key, cacheState: 'hit' }, 'The request used cached market data.');
      return entry.value;
    }
    entries.delete(key);
    logger.debug({ key, cacheState: 'miss' }, 'The request needs new market data.');
    const pending = load().then(
      (value) => {
        entries.set(key, { value, expiresAt: now() + ttlMs });
        return value;
      },
      (error: unknown) => {
        entries.delete(key);
        throw error;
      },
    );
    entries.set(key, { pending });
    return pending;
  }

  return {
    getCandles(request) {
      const key = `candles:${request.pair}:${request.timeframe}:${request.limit}`;
      return read(candles, key, () => provider.getCandles(request));
    },
    getSummary(pair) {
      return read(summaries, `summary:${pair}`, () => provider.getSummary(pair));
    },
  };
}
