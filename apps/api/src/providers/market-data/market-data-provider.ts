import type {
  CandleHistory,
  MarketPair,
  MarketSummary,
  MarketTimeframe,
} from '@crypto-force/shared';

export interface CandleRequest {
  pair: MarketPair;
  timeframe: MarketTimeframe;
  limit: number;
}

export type CandleSnapshot = Pick<CandleHistory, 'candles' | 'dataTime'>;

export interface MarketDataProvider {
  getCandles(request: CandleRequest): Promise<CandleSnapshot>;
  getSummary(pair: MarketPair): Promise<MarketSummary>;
}

export class MarketDataProviderError extends Error {
  constructor(
    readonly kind: 'invalid' | 'unavailable',
    options?: ErrorOptions,
    readonly upstreamStatus?: number,
  ) {
    super('The market data provider request failed.', options);
    this.name = 'MarketDataProviderError';
  }
}
