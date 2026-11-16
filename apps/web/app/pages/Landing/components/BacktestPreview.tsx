import { cn } from '~/utils/cn';

const trades = [
  {
    opened: '01 May, 06:15',
    side: 'LONG',
    entry: '68,120.50',
    exit: '69,050.80',
    pnl: '+0.83',
    win: true,
  },
  {
    opened: '01 May, 09:40',
    side: 'SHORT',
    entry: '69,450.20',
    exit: '68,430.10',
    pnl: '+0.87',
    win: true,
  },
  {
    opened: '01 May, 12:25',
    side: 'LONG',
    entry: '68,600.10',
    exit: '67,980.00',
    pnl: '−0.67',
    win: false,
  },
  {
    opened: '01 May, 15:50',
    side: 'SHORT',
    entry: '68,200.40',
    exit: '67,350.30',
    pnl: '+0.75',
    win: true,
  },
] as const;

const metricCard = 'rounded-[10px] border bg-secondary px-4 py-3';

export function BacktestPreview() {
  return (
    <figure className="m-0 flex flex-1 flex-col overflow-hidden rounded-[14px] border border-input/40 bg-card shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
      <div
        aria-hidden="true"
        className="flex min-h-[46px] items-center gap-5 overflow-x-auto border-b px-5 text-[13px] whitespace-nowrap text-muted-foreground"
      >
        <span className="flex gap-2">
          <span className="size-2.5 rounded-full bg-input/50" />
          <span className="size-2.5 rounded-full bg-input/50" />
          <span className="size-2.5 rounded-full bg-input/50" />
        </span>
        <span className="font-semibold text-secondary-foreground/80">Backtest result</span>
        <span className="ml-auto rounded-md border px-2 py-0.5 text-xs">Example</span>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="text-[15px] font-semibold">
          MA Crossover · BTCUSDT 5m · 01 May – 15 May 2025
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <div className={metricCard}>
            <div className="text-[13px] text-muted-foreground">Net return</div>
            <div className="text-[26px] font-semibold text-success">+8.42%</div>
          </div>
          <div className={metricCard}>
            <div className="text-[13px] text-muted-foreground">Max drawdown</div>
            <div className="text-[26px] font-semibold text-destructive">−3.03%</div>
          </div>
          <div className={metricCard}>
            <div className="text-[13px] text-muted-foreground">Win rate</div>
            <div className="text-[26px] font-semibold">61.80%</div>
            <div className="text-xs text-muted-foreground">110 of 178 trades</div>
          </div>
          <div className={cn(metricCard, 'flex flex-col gap-3')}>
            <div className="text-[13px] text-muted-foreground">Return vs. max drawdown</div>
            <div
              role="img"
              aria-label="Worst drop −3.03%, return +8.42%"
              className="relative h-[18px]"
            >
              <span className="absolute inset-x-0 top-2 border-t border-input/50" />
              <span className="absolute top-0 left-[33.3%] h-[18px] border-l-[1.5px] border-foreground" />
              <span className="absolute top-1.5 left-[11.9%] h-1.5 w-[21.4%] bg-destructive" />
              <span className="absolute top-1.5 left-[33.3%] h-1.5 w-[56.1%] bg-success" />
            </div>
          </div>
        </div>
        <div
          tabIndex={0}
          role="region"
          aria-label="Example trades"
          className="overflow-x-auto rounded-md"
        >
          <table className="w-full min-w-[620px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-input/40 text-right text-muted-foreground">
                <th className="py-2 text-left font-semibold">Opened</th>
                <th className="text-left font-semibold">Side</th>
                <th className="font-semibold">Entry</th>
                <th className="font-semibold">Exit</th>
                <th className="font-semibold">Fee</th>
                <th className="font-semibold">Slip.</th>
                <th className="font-semibold">P/L (USD)</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.opened} className="border-b text-right last:border-b-0">
                  <td className="py-2 text-left">{trade.opened}</td>
                  <td
                    className={cn(
                      'text-left font-semibold',
                      trade.side === 'LONG' ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {trade.side}
                  </td>
                  <td>{trade.entry}</td>
                  <td>{trade.exit}</td>
                  <td className="text-muted-foreground">−0.05</td>
                  <td className="text-muted-foreground">−0.03</td>
                  <td
                    className={cn('font-semibold', trade.win ? 'text-success' : 'text-destructive')}
                  >
                    {trade.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="border-t px-4 py-3 text-[13px] text-muted-foreground sm:px-6">
        Illustrative backtest preview for BTCUSDT. Values are examples, not verified trading results
        or a forecast.
      </figcaption>
    </figure>
  );
}
