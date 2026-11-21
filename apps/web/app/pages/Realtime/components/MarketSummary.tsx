import type { MarketPair } from '@crypto-force/shared';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { useMarketSummary } from '~/hooks/useMarketData';
import { useRetryFocus } from '~/hooks/useRetryFocus';
import { formatPrice } from '~/utils/market-chart';

/**
 * Pair information and its data status only. MA and volume depend on the chart timeframe, so they
 * stay on each chart (docs/UCs/market-data.md, MK-29, MK-60).
 */
export function MarketSummary({ pair }: { pair: MarketPair }) {
  const summary = useMarketSummary(pair);
  const loading = summary.isFetching && !summary.data;
  const status = loading
    ? 'Loading market summary…'
    : summary.isError
      ? 'Cannot load the market summary.'
      : '';
  // Same rule as the chart Retry: keep the button from the first error until data arrives.
  const showRetry = !summary.data && summary.errorUpdateCount > 0;
  const { containerRef, onRetry } = useRetryFocus<HTMLDivElement>(showRetry);
  return (
    <Card
      ref={containerRef}
      role="region"
      tabIndex={-1}
      aria-label="Market summary"
      className="h-fit min-w-0 gap-4 outline-none"
    >
      <CardHeader>
        <h2 className="font-semibold">Market summary · {pair}</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p role="status" aria-live="polite" className={status ? 'text-sm' : 'sr-only'}>
          {status}
        </p>
        {showRetry ? (
          <Button
            variant="outline"
            className="self-start"
            aria-disabled={summary.isFetching}
            onClick={(event) => {
              if (summary.isFetching) return;
              onRetry(event.currentTarget);
              void summary.refetch();
            }}
          >
            Retry summary
          </Button>
        ) : null}
        {summary.data ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Last price</dt>
            <dd className="text-right font-mono" aria-label="Last price">
              {formatPrice(pair, summary.data.lastPrice)} USDT
            </dd>
            <dt className="text-muted-foreground">Change (24h)</dt>
            <dd aria-label="Change 24h" className="text-right font-mono">
              {summary.data.change24hPercent > 0 ? '+' : ''}
              {summary.data.change24hPercent.toFixed(2)}%
            </dd>
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}
