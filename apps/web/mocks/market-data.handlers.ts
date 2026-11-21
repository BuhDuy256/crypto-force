import { candleHistoryInputSchema, marketPairSchema } from '@crypto-force/shared';
import { http, HttpResponse } from 'msw';
import { candleFixture, summaryFixture } from './fixtures/market-data';

export const marketDataHandlers = [
  http.get('/api/market-data/candles', ({ request }) => {
    const input = candleHistoryInputSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!input.success)
      return HttpResponse.json({ message: 'Invalid market selection.' }, { status: 400 });
    return HttpResponse.json(candleFixture(input.data.pair, input.data.timeframe));
  }),
  http.get('/api/market-data/summary', ({ request }) => {
    const pair = marketPairSchema.safeParse(new URL(request.url).searchParams.get('pair'));
    if (!pair.success)
      return HttpResponse.json({ message: 'Invalid market pair.' }, { status: 400 });
    return HttpResponse.json(summaryFixture(pair.data));
  }),
];
