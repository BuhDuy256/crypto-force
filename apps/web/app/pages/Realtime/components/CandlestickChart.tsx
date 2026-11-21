import { useId, useMemo } from 'react';
import type { CandleHistory } from '@crypto-force/shared';
import { useCandlestickChart } from '~/hooks/useCandlestickChart';
import { formatDateTime, formatPrice, formatVolume, toChartSeries } from '~/utils/market-chart';

/**
 * Chart canvas with a text equivalent. `describedBy` names the element with the last candle values
 * (MK-47). The legend shows the candle under the pointer or the keyboard selection (MK-41).
 */
export function CandlestickChart({
  history,
  describedBy,
}: {
  history: CandleHistory;
  describedBy: string;
}) {
  const { containerRef, selected, onKeyDown } = useCandlestickChart(history);
  const hintId = useId();
  const ma20 = useMemo(() => toChartSeries(history).ma20, [history]);
  const candle =
    selected === null
      ? undefined
      : history.candles
          .slice(history.warmupCount)
          .find((candidate) => candidate.openTime === selected);
  const ma = candle ? ma20.find((point) => point.time * 1000 === candle.openTime) : undefined;
  const price = (value: number) => formatPrice(history.pair, value);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        ref={containerRef}
        role="group"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={`${history.pair} ${history.timeframe} candlesticks, volume and MA(20)`}
        aria-describedby={`${describedBy} ${hintId}`}
        className="h-[280px] min-w-0 rounded-md bg-card text-card-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      />
      <span id={hintId} className="sr-only">
        Left and Right arrows select a candle. Plus and minus zoom.
      </span>
      {candle ? (
        <p className="text-xs text-muted-foreground" aria-label="Selected candle">
          {formatDateTime(candle.openTime)}
          {candle.isClosed ? '' : ' (open candle)'} · O {price(candle.open)} · H{' '}
          {price(candle.high)} · L {price(candle.low)} · C {price(candle.close)} · V{' '}
          {formatVolume(candle.volume)} · MA(20){' '}
          {ma ? `${price(ma.value)}${candle.isClosed ? '' : ' (provisional)'}` : 'Not enough data'}
        </p>
      ) : null}
    </div>
  );
}
