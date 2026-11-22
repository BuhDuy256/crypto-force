import type { MarketPair, MarketTimeframe } from '@crypto-force/shared';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Separator } from '~/components/ui/separator';
import { useCandleHistory, useMarketSummary } from '~/hooks/useMarketData';

export function MarketSummary({
  pair,
  timeframe,
}: {
  pair: MarketPair;
  timeframe: MarketTimeframe;
}) {
  const summary = useMarketSummary(pair);
  const history = useCandleHistory(pair, timeframe);
  const last = history.data?.candles.at(-1);
  const ma = history.data?.ma20.at(-1);
  return (
    <Card role="region" aria-label="Market summary" className="h-fit min-w-0 gap-4">
      <CardHeader>
        <h2 className="font-semibold">Market summary · {pair}</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {summary.isPending ? <p role="status">Loading market summary…</p> : null}
        {summary.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              <p>
                {summary.data
                  ? 'Could not refresh the market summary. Previous data remains visible.'
                  : 'Cannot load the market summary.'}
              </p>
              <Button
                variant="outline"
                className="text-foreground"
                disabled={summary.isFetching}
                onClick={() => {
                  void summary.refetch();
                }}
              >
                Retry summary
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {summary.data ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Last price</dt>
            <dd className="text-right font-mono" aria-label="Last price">
              {summary.data.lastPrice.toLocaleString('en-US')} USDT
            </dd>
            <dt className="text-muted-foreground">Change (24h)</dt>
            <dd aria-label="Change 24h" className="text-right font-mono">
              {summary.data.change24hPercent > 0 ? '+' : ''}
              {summary.data.change24hPercent.toFixed(2)}%
            </dd>
          </dl>
        ) : null}
        <Separator />
        <h3 className="text-sm font-medium">Chart 1 · {timeframe}</h3>
        {history.isPending ? <p role="status">Loading chart information…</p> : null}
        {history.isError ? (
          <p role="alert">
            {history.data
              ? 'Chart information refresh failed. Previous values remain visible.'
              : 'Chart information is unavailable. Retry chart 1.'}
          </p>
        ) : null}
        {history.data ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">MA(20) · {timeframe}</dt>
            <dd aria-label="Summary MA20" className="text-right font-mono">
              {ma ? ma.value.toLocaleString('en-US') : 'Not enough data'}
            </dd>
            <dt className="text-muted-foreground">Volume · {timeframe}</dt>
            <dd aria-label="Summary volume" className="text-right font-mono">
              {last ? last.volume.toLocaleString('en-US') : 'No data'}
            </dd>
          </dl>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {summary.isFetching
            ? 'Loading summary…'
            : summary.isError
              ? 'Summary unavailable'
              : 'Summary loaded'}
        </p>
      </CardContent>
    </Card>
  );
}
