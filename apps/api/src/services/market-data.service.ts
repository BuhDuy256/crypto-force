import {
  candleHistorySchema,
  marketSummarySchema,
  type MarketPair,
  type MarketTimeframe,
} from '@crypto-force/shared';
import type { Logger } from 'pino';
import { AppError } from '../errors/app-error';
import {
  MarketDataProviderError,
  type MarketDataProvider,
} from '../providers/market-data/market-data-provider';

const DISPLAY_CANDLES = 500;
const MA_PERIOD = 20;
const REQUEST_CANDLES = DISPLAY_CANDLES + MA_PERIOD - 1;

interface RequestTiming {
  providerDurationMs: number;
  receivedCount?: number;
  violations?: { path: string; rule: string; openTime?: number }[];
}

export function createMarketDataService({
  provider,
  logger,
}: {
  provider: MarketDataProvider;
  logger: Logger;
}) {
  async function run<T>(
    context: { pair: MarketPair; timeframe?: MarketTimeframe; requestedCount?: number },
    operation: (timing: RequestTiming) => Promise<T>,
  ): Promise<T> {
    const start = performance.now();
    const timing: RequestTiming = {
      providerDurationMs: 0,
    };
    try {
      const result = await operation(timing);
      logger.info(
        { ...context, ...timing, durationMs: performance.now() - start, outcome: 'success' },
        'The market data request succeeded.',
      );
      return result;
    } catch (error) {
      const kind = error instanceof MarketDataProviderError ? error.kind : 'unexpected';
      const networkCause =
        error instanceof MarketDataProviderError &&
        kind === 'unavailable' &&
        error.cause instanceof Error
          ? error.cause
          : undefined;
      const detail = networkCause?.cause ?? networkCause;
      const code =
        detail && typeof detail === 'object' && 'code' in detail ? detail.code : undefined;
      const fields = {
        ...context,
        ...timing,
        durationMs: performance.now() - start,
        outcome: 'error',
        kind,
        networkError: networkCause
          ? {
              name: ['Error', 'TypeError', 'AbortError'].includes(networkCause.name)
                ? networkCause.name
                : 'Error',
              code: typeof code === 'string' && /^[A-Z][A-Z0-9_]*$/.test(code) ? code : undefined,
            }
          : undefined,
        upstreamStatus: error instanceof MarketDataProviderError ? error.upstreamStatus : undefined,
      };
      if (kind === 'invalid') logger.error(fields, 'The market data is invalid.');
      else logger.warn(fields, 'The market data request failed.');
      if (kind === 'invalid')
        throw new AppError(502, 'MARKET_DATA_INVALID', 'The market data is invalid.', {
          cause: error,
        });
      if (kind === 'unavailable')
        throw new AppError(503, 'MARKET_DATA_UNAVAILABLE', 'The market data is unavailable.', {
          cause: error,
        });
      throw error;
    }
  }

  return {
    getCandleHistory(input: { pair: MarketPair; timeframe: MarketTimeframe }) {
      return run({ ...input, requestedCount: REQUEST_CANDLES }, async (timing) => {
        const start = performance.now();
        let snapshot;
        try {
          snapshot = await provider.getCandles({ ...input, limit: REQUEST_CANDLES });
        } finally {
          timing.providerDurationMs = performance.now() - start;
        }
        timing.receivedCount = snapshot.candles.length;
        const parsed = candleHistorySchema.safeParse({
          ...input,
          candles: snapshot.candles,
          dataTime: snapshot.dataTime,
          warmupCount: Math.max(0, snapshot.candles.length - DISPLAY_CANDLES),
        });
        if (!parsed.success) {
          timing.violations = parsed.error.issues.map((issue) => {
            const index =
              issue.path[0] === 'candles' && typeof issue.path[1] === 'number'
                ? issue.path[1]
                : undefined;
            const openTime = index === undefined ? undefined : snapshot.candles[index]?.openTime;
            return {
              path: issue.path.join('.'),
              rule: issue.message,
              ...(typeof openTime === 'number' ? { openTime } : {}),
            };
          });
          throw new MarketDataProviderError('invalid', { cause: parsed.error });
        }
        return parsed.data;
      });
    },
    getMarketSummary(pair: MarketPair) {
      return run({ pair }, async (timing) => {
        const start = performance.now();
        let summary;
        try {
          summary = await provider.getSummary(pair);
        } finally {
          timing.providerDurationMs = performance.now() - start;
        }
        const parsed = marketSummarySchema.safeParse(summary);
        if (!parsed.success || parsed.data.pair !== pair)
          throw new MarketDataProviderError('invalid');
        return parsed.data;
      });
    },
  };
}
