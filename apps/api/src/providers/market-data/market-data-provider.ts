import type {
  Candle,
  CandleHistory,
  MarketChannel,
  MarketPair,
  MarketSummary,
  MarketTimeframe,
} from '@crypto-force/shared';

interface CandleRequest {
  pair: MarketPair;
  timeframe: MarketTimeframe;
  limit: number;
}

type CandleSnapshot = Pick<CandleHistory, 'candles' | 'dataTime'>;

export interface MarketDataProvider {
  getCandles(request: CandleRequest): Promise<CandleSnapshot>;
  getSummary(pair: MarketPair): Promise<MarketSummary>;
}

export interface StreamCandleEvent {
  pair: MarketPair;
  timeframe: MarketTimeframe;
  candle: Candle;
  dataTime: number;
  sourceTime?: number;
}

export interface StreamSummaryEvent {
  summary: MarketSummary;
  sourceTime?: number;
}

export interface StreamStatusEvent {
  upstream: 'available' | 'unavailable';
  resyncRequired: boolean;
}

export interface MarketDataStreamProvider {
  subscribe(channel: MarketChannel): void;
  unsubscribe(channel: MarketChannel): void;
  onCandle(handler: (event: StreamCandleEvent) => void): void;
  onSummary(handler: (event: StreamSummaryEvent) => void): void;
  onStatus(handler: (event: StreamStatusEvent) => void): void;
  close(): Promise<void>;
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
