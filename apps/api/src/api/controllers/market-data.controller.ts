import { candleHistoryInputSchema, marketSummaryInputSchema } from '@crypto-force/shared';
import type { RequestHandler } from 'express';
import { AppError } from '../../errors/app-error';
import type { createMarketDataService } from '../../services/market-data.service';

export function createMarketDataController(service: ReturnType<typeof createMarketDataService>) {
  const candles: RequestHandler = async (req, res) => {
    const input = candleHistoryInputSchema.safeParse(req.query);
    if (!input.success) throw new AppError(400, 'INVALID_QUERY', 'The query is not valid.');
    res.json(await service.getCandleHistory(input.data));
  };
  const summary: RequestHandler = async (req, res) => {
    const input = marketSummaryInputSchema.safeParse(req.query);
    if (!input.success) throw new AppError(400, 'INVALID_QUERY', 'The query is not valid.');
    res.json(await service.getMarketSummary(input.data.pair));
  };
  return { candles, summary };
}
