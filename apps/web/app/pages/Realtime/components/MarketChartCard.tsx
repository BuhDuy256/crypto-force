import { marketTimeframeSchema, type MarketPair, type MarketTimeframe } from '@crypto-force/shared';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
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
import { CandlestickChart } from './CandlestickChart';

export function MarketChartCard({
  chartId,
  pair,
  timeframe,
  onTimeframeChange,
}: {
  chartId: number;
  pair: MarketPair;
  timeframe: MarketTimeframe;
  onTimeframeChange: (id: number, timeframe: MarketTimeframe) => void;
}) {
  const query = useCandleHistory(pair, timeframe);
  const last = query.data?.candles.at(-1);
  const ma = query.data?.ma20.at(-1);
  return (
    <Card role="region" aria-label={`Chart ${chartId}`} className="min-w-0 gap-3 py-4">
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
        {query.isPending ? (
          <div role="status">
            <p>Loading candles…</p>
            <Skeleton className="h-[280px] w-full" />
          </div>
        ) : null}
        {query.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              <p>
                {query.data
                  ? 'Could not refresh candles. Previous data remains visible.'
                  : 'Cannot load candle history.'}
              </p>
              <Button
                variant="outline"
                className="text-foreground"
                disabled={query.isFetching}
                onClick={() => {
                  void query.refetch();
                }}
              >
                Retry chart {chartId}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {query.data ? (
          <>
            {last ? (
              <>
                <p className="text-xs text-muted-foreground" aria-label={`Chart ${chartId} values`}>
                  Close {last.close.toLocaleString('en-US')} · Volume{' '}
                  {last.volume.toLocaleString('en-US')} · MA(20){' '}
                  {ma ? ma.value.toLocaleString('en-US') : 'Not enough data'}
                </p>
                <CandlestickChart history={query.data} />
              </>
            ) : (
              <p>No candle history for this selection.</p>
            )}
            <p className="text-xs text-muted-foreground">
              {query.isFetching
                ? 'Refreshing candles…'
                : query.isError
                  ? 'Refresh failed'
                  : 'Data loaded'}{' '}
              · {timeframe}
            </p>
          </>
        ) : null}
        <Button
          variant="outline"
          className="self-start"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          Load history<span className="sr-only"> for chart {chartId}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
