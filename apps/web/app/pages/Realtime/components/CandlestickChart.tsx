import type { CandleHistory } from '@crypto-force/shared';
import { useCandlestickChart } from '~/hooks/useCandlestickChart';

export function CandlestickChart({ history }: { history: CandleHistory }) {
  const ref = useCandlestickChart(history);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={`${history.pair} ${history.timeframe} candlesticks, volume and MA(20)`}
      className="h-[280px] min-w-0 bg-card text-card-foreground"
    />
  );
}
