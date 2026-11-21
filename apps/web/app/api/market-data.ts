import { z } from 'zod';
import {
  candleHistorySchema,
  marketSummarySchema,
  type MarketPair,
  type MarketTimeframe,
} from '@crypto-force/shared';

/** A chart without data after this delay shows an error with retry (docs/UCs/market-data.md, MK-34). */
const CHART_TIMEOUT_MS = 10_000;

const errorEnvelopeSchema = z.object({ error: z.object({ code: z.string() }) });

/**
 * Failed Market Data request. `code` is the API error code (docs/architecture/22-api-endpoints.md,
 * Lỗi Market Data), `TIMEOUT` when the chart deadline ends the request, or `MARKET_DATA_INVALID`
 * when the response does not match the contract. The message never carries the response body.
 */
export class MarketDataRequestError extends Error {
  constructor(readonly code: string) {
    super(`Market Data request failed: ${code}.`);
    this.name = 'MarketDataRequestError';
  }
}

async function readJson(path: string, signal: AbortSignal, timeoutMs?: number) {
  const controller = new AbortController();
  const abort = () => {
    controller.abort(signal.reason);
  };
  signal.addEventListener('abort', abort, { once: true });
  // setTimeout, not AbortSignal.timeout, so the deadline follows the page clock.
  const timer =
    timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
          controller.abort(new MarketDataRequestError('TIMEOUT'));
        }, timeoutMs);
  try {
    const response = await fetch(path, { signal: controller.signal });
    // A body that is not JSON is handled as invalid data; an abort while reading keeps its reason.
    const body: unknown = await response.json().catch((error: unknown) => {
      if (controller.signal.aborted) throw error;
      return undefined;
    });
    if (!response.ok) {
      const envelope = errorEnvelopeSchema.safeParse(body);
      throw new MarketDataRequestError(
        envelope.success ? envelope.data.error.code : 'INTERNAL_ERROR',
      );
    }
    return body;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

export async function getCandleHistory(
  input: { pair: MarketPair; timeframe: MarketTimeframe },
  signal: AbortSignal,
) {
  const body = await readJson(
    `/api/market-data/candles?${new URLSearchParams(input)}`,
    signal,
    CHART_TIMEOUT_MS,
  );
  const data = candleHistorySchema.safeParse(body);
  if (!data.success || data.data.pair !== input.pair || data.data.timeframe !== input.timeframe) {
    throw new MarketDataRequestError('MARKET_DATA_INVALID');
  }
  return data.data;
}

export async function getMarketSummary(pair: MarketPair, signal: AbortSignal) {
  const body = await readJson(`/api/market-data/summary?${new URLSearchParams({ pair })}`, signal);
  const data = marketSummarySchema.safeParse(body);
  if (!data.success || data.data.pair !== pair) {
    throw new MarketDataRequestError('MARKET_DATA_INVALID');
  }
  return data.data;
}
