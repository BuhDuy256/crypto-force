import { useId } from 'react';
import { marketTimeframeSchema, type MarketPair, type MarketTimeframe } from '@crypto-force/shared';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useCandleHistory } from '~/hooks/useMarketData';
import { useRetryFocus } from '~/hooks/useRetryFocus';
import { CandlestickChart } from './CandlestickChart';
import { formatDateTime, formatPrice, formatVolume, toChartSeries } from '~/utils/market-chart';

export function MarketChartCard({
  chartId,
  pair,
  timeframe,
  onTimeframeChange,
  live,
}: {
  chartId: number;
  pair: MarketPair;
  timeframe: MarketTimeframe;
  onTimeframeChange: (id: number, timeframe: MarketTimeframe) => void;
  live: boolean;
}) {
  const query = useCandleHistory(pair, timeframe, live);
  const valuesId = useId();
  const history = query.data;
  const last = history?.candles.at(-1);
  const ma = history ? toChartSeries(history).ma20.at(-1) : undefined;
  const loading = query.isFetching && !history;
  // The status element stays in the DOM and only its text changes, so assistive technology
  // announces each change without a focus move (MK-48).
  const status = loading
    ? 'Loading candles…'
    : query.isError
      ? 'Cannot load candle history.'
      : history && !last
        ? 'No candle history for this selection.'
        : '';
  // A retry without data puts the query back to pending. Keep the Retry button from the first error
  // until data arrives, so it keeps focus while the retry loads (MK-38, MK-46).
  const showRetry = !history && query.errorUpdateCount > 0;
  const { containerRef, onRetry } = useRetryFocus<HTMLDivElement>(showRetry);
  return (
    <Card
      ref={containerRef}
      role="region"
      tabIndex={-1}
      aria-label={`Chart ${chartId}`}
      className="min-w-0 gap-3 py-4 outline-none"
    >
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4">
        <h2 className="font-semibold">
          {pair}{' '}
          <span className="text-sm font-normal text-muted-foreground">· Chart {chartId}</span>
        </h2>
        <Select
          value={timeframe}
          onValueChange={(value) => {
            onTimeframeChange(chartId, marketTimeframeSchema.parse(value));
          }}
        >
          <SelectTrigger aria-label={`Timeframe for chart ${chartId}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {marketTimeframeSchema.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <p role="status" aria-live="polite" className={status ? 'text-sm' : 'sr-only'}>
          {status}
        </p>
        {loading ? <Skeleton className="h-[280px] w-full" /> : null}
        {showRetry ? (
          // aria-disabled keeps focus on the button while the retry loads (MK-38).
          <Button
            variant="outline"
            className="self-start"
            aria-disabled={query.isFetching}
            onClick={(event) => {
              if (query.isFetching) return;
              onRetry(event.currentTarget);
              void query.refetch();
            }}
          >
            Retry chart {chartId}
          </Button>
        ) : null}
        {history && last ? (
          <>
            {/* The chart description points to the inner span: a description taken from an
                element with aria-label would read the label instead of the values (MK-47). */}
            <p className="text-xs text-muted-foreground" aria-label={`Chart ${chartId} values`}>
              <span id={valuesId}>
                {last.isClosed ? '' : 'Open candle · '}Close {formatPrice(pair, last.close)} ·
                Volume {formatVolume(last.volume)} · MA(20){' '}
                {ma
                  ? `${formatPrice(pair, ma.value)}${last.isClosed ? '' : ' (provisional)'}`
                  : 'Not enough data'}
              </span>
            </p>
            <CandlestickChart history={history} describedBy={valuesId} />
          </>
        ) : null}
        {history ? (
          <p className="text-xs text-muted-foreground">
            Data time {formatDateTime(history.dataTime)} · {timeframe}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
