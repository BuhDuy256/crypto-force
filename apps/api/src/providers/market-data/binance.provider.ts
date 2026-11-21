import type { Logger } from 'pino';
import { z } from 'zod';
import { MarketDataProviderError, type MarketDataProvider } from './market-data-provider';

const decimal = z
  .string()
  .regex(/^-?\d+(?:\.\d+)?$/)
  .transform(Number)
  .pipe(z.number());
const timestamp = z.number().int().nonnegative();
const klineSchema = z.tuple([
  timestamp,
  decimal,
  decimal,
  decimal,
  decimal,
  decimal,
  timestamp,
  z.unknown(),
  z.unknown(),
  z.unknown(),
  z.unknown(),
  z.unknown(),
]);
const summarySchema = z.object({
  symbol: z.string(),
  lastPrice: decimal,
  priceChangePercent: decimal,
});

export function createBinanceMarketDataProvider({
  fetch,
  now,
  timeoutMs,
  logger,
}: {
  fetch: typeof globalThis.fetch;
  now: () => number;
  timeoutMs: number;
  logger: Logger;
}): MarketDataProvider {
  let cooldownUntil = 0;

  async function request(
    path: string,
    query: Record<string, string>,
  ): Promise<{ payload: unknown; dataTime: number }> {
    if (now() < cooldownUntil) throw new MarketDataProviderError('unavailable');
    const url = new URL(path, 'https://api.binance.com');
    url.search = new URLSearchParams(query).toString();
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new MarketDataProviderError('unavailable'));
      }, timeoutMs);
    });
    try {
      return await Promise.race([
        (async () => {
          const response = await fetch(url, { signal: controller.signal });
          const dataTime = now();
          controller.signal.throwIfAborted();
          const usedWeight = response.headers.get('X-MBX-USED-WEIGHT-1M');
          if (usedWeight !== null)
            logger.debug({ usedWeight }, 'Binance returned the request weight.');
          if (!response.ok) {
            if (response.status === 429 || response.status === 418) {
              const retryAfter = response.headers.get('Retry-After');
              const seconds = retryAfter === null ? NaN : Number(retryAfter);
              if (Number.isFinite(seconds) && seconds >= 0)
                cooldownUntil = Math.max(cooldownUntil, dataTime + seconds * 1000);
              logger.warn(
                { upstreamStatus: response.status, retryAfter, usedWeight },
                'Binance limited the requests.',
              );
            }
            throw new MarketDataProviderError('unavailable', undefined, response.status);
          }
          try {
            const payload: unknown = await response.json();
            controller.signal.throwIfAborted();
            return { payload, dataTime };
          } catch (error) {
            if (controller.signal.aborted)
              throw new MarketDataProviderError('unavailable', { cause: error });
            throw new MarketDataProviderError('invalid', { cause: error });
          }
        })(),
        deadline,
      ]);
    } catch (error) {
      if (error instanceof MarketDataProviderError) throw error;
      throw new MarketDataProviderError('unavailable', { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async getCandles({ pair, timeframe, limit }) {
      const { payload, dataTime } = await request('/api/v3/klines', {
        symbol: pair,
        interval: timeframe,
        limit: String(limit),
      });
      const parsed = z.array(klineSchema).max(limit).safeParse(payload);
      if (!parsed.success) throw new MarketDataProviderError('invalid', { cause: parsed.error });
      return {
        candles: parsed.data.map(([openTime, open, high, low, close, volume, closeTime]) => ({
          openTime,
          open,
          high,
          low,
          close,
          volume,
          isClosed: closeTime < dataTime,
        })),
        dataTime,
      };
    },
    async getSummary(pair) {
      const { payload } = await request('/api/v3/ticker/24hr', { symbol: pair });
      const parsed = summarySchema.safeParse(payload);
      if (!parsed.success || parsed.data.symbol !== pair)
        throw new MarketDataProviderError('invalid');
      return {
        pair,
        lastPrice: parsed.data.lastPrice,
        change24hPercent: parsed.data.priceChangePercent,
      };
    },
  };
}
