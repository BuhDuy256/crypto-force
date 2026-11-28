import { useState, type JSX } from 'react';
import type {
  BacktestPriceCandle,
  BacktestResultSummary,
  BacktestRunDetail,
  BacktestTrade,
} from '@crypto-force/shared';
import { Check, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useEquityDrawdownChart, usePriceTradesChart } from '~/hooks/useBacktestCharts';
import { cn } from '~/utils/cn';
import { formatRunTitle } from '~/utils/strategy-draft';
import { BacktestTradesTable } from './BacktestTradesTable';
import { InfoTip } from './InfoTip';

const usd = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const perTrade = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const percent = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MAX_DRAWDOWN_EXPLANATION =
  'The largest drop from a peak to a later low during the test. This measures the largest peak-to-trough decline in simulated account value.';
const WIN_RATE_EXPLANATION = 'Share of closed trades that made money after fees and slippage.';
const PER_TRADE_EXPLANATION =
  'Average net result of one trade, next to the average fee plus slippage it paid.';
const VS_BUY_AND_HOLD_EXPLANATION =
  'What simply holding the pair over the same period would have returned, from the same candles.';

function signed(value: number, body: string): string {
  if (value > 0) return `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}

function formatUsd(value: number): string {
  return signed(value, usd.format(Math.abs(value)));
}

function formatPercent(value: number): string {
  return signed(value, `${percent.format(Math.abs(value))}%`);
}

function formatPrice(value: number): string {
  return usd.format(value);
}

function pnlColor(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-destructive';
  return 'text-foreground';
}

function latestValue(points: BacktestPriceCandle[], key: 'ma20' | 'ma50'): number | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const value = points[index]?.[key];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

function MetricLabel({
  label,
  explanation,
  tipAlign = 'start',
}: {
  label: string;
  explanation?: string;
  tipAlign?: 'start' | 'end';
}) {
  return (
    <dt className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
      {label}
      {explanation === undefined ? null : (
        <InfoTip label={label} explanation={explanation} align={tipAlign} />
      )}
    </dt>
  );
}

function Summary({
  run,
  result,
  metaPrefix,
}: {
  run: BacktestRunDetail;
  result: BacktestResultSummary;
  metaPrefix: string | null;
}) {
  const scaleMin = Math.min(-5, Math.floor(result.maxDrawdownPercent));
  const scaleMax = Math.max(10, Math.ceil(result.netReturnPercent));
  const span = scaleMax - scaleMin;
  const zero = ((0 - scaleMin) / span) * 100;
  const returnWidth = (Math.max(0, result.netReturnPercent) / span) * 100;
  const drawdownWidth = (Math.abs(Math.min(0, result.maxDrawdownPercent)) / span) * 100;
  const ahead = result.vsBuyAndHoldPts >= 0;

  return (
    <section
      aria-labelledby="backtest-summary-heading"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5"
    >
      {metaPrefix === null ? (
        <h3 id="backtest-summary-heading" className="text-base font-semibold">
          Results
        </h3>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id="backtest-summary-heading" className="text-xl font-semibold break-words">
            {formatRunTitle(run)}
          </h2>
          <span className="text-sm text-muted-foreground">
            {metaPrefix} {run.id} · Capital {run.capitalUsd} USD · fee {run.feePercent}% · slippage{' '}
            {run.slippageBps} bps
          </span>
        </div>
      )}
      <dl className="flex flex-wrap gap-x-8 gap-y-4">
        <div className="flex min-w-36 flex-col gap-0.5">
          <MetricLabel label="Net return" />
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn('text-3xl font-semibold', pnlColor(result.netReturnUsd))}>
              {formatUsd(result.netReturnUsd)}
            </span>
            <span className={cn('text-sm font-semibold', pnlColor(result.netReturnUsd))}>
              USD · {formatPercent(result.netReturnPercent)}
            </span>
          </dd>
        </div>

        <div className="flex min-w-36 flex-col gap-0.5">
          <MetricLabel label="Max drawdown" explanation={MAX_DRAWDOWN_EXPLANATION} />
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn('text-3xl font-semibold', pnlColor(result.maxDrawdownUsd))}>
              {formatUsd(result.maxDrawdownUsd)}
            </span>
            <span className={cn('text-sm font-semibold', pnlColor(result.maxDrawdownUsd))}>
              USD · {formatPercent(result.maxDrawdownPercent)}
            </span>
          </dd>
        </div>

        <div className="flex min-w-32 flex-col gap-0.5">
          <MetricLabel label="Win rate" explanation={WIN_RATE_EXPLANATION} />
          <dd>
            <span className="text-3xl font-semibold">{percent.format(result.winRatePercent)}%</span>
            <span className="block text-xs text-muted-foreground">
              {result.winningTrades} of {result.totalTrades}
            </span>
          </dd>
        </div>

        <div className="flex min-w-24 flex-col gap-0.5">
          <MetricLabel label="Trades" />
          <dd className="text-2xl font-semibold">{result.totalTrades}</dd>
        </div>

        <div className="flex min-w-40 flex-col gap-0.5">
          <MetricLabel label="Per trade" explanation={PER_TRADE_EXPLANATION} />
          <dd>
            <span className={cn('text-xl font-semibold', pnlColor(result.avgNetPerTradeUsd))}>
              {signed(
                result.avgNetPerTradeUsd,
                perTrade.format(Math.abs(result.avgNetPerTradeUsd)),
              )}
            </span>{' '}
            <span className="text-xs text-muted-foreground">net</span>
            <span className="block text-xs text-warning">
              cost {perTrade.format(result.avgCostPerTradeUsd)} / trade
            </span>
          </dd>
        </div>

        <div className="flex min-w-44 flex-col gap-0.5">
          <MetricLabel
            label="vs. buy & hold"
            explanation={VS_BUY_AND_HOLD_EXPLANATION}
            tipAlign="end"
          />
          <dd>
            <span className="text-xl font-semibold">{formatPercent(result.buyAndHoldPercent)}</span>
            <span className={cn('block text-xs', ahead ? 'text-success' : 'text-destructive')}>
              strategy{' '}
              {signed(
                result.vsBuyAndHoldPts,
                `${percent.format(Math.abs(result.vsBuyAndHoldPts))} pts`,
              )}{' '}
              {ahead ? 'ahead' : 'behind'}
            </span>
          </dd>
        </div>

        <div className="flex min-w-64 flex-1 flex-col gap-1">
          <MetricLabel label="Return vs. max drawdown" />
          <dd>
            <div
              role="img"
              aria-label={`Worst drop ${formatPercent(result.maxDrawdownPercent)}, return ${formatPercent(result.netReturnPercent)}`}
              className="relative h-3 w-full rounded-sm bg-secondary"
            >
              <span className="absolute inset-x-0 top-1/2 border-t" />
              <span
                className="absolute top-1/2 h-2 -translate-y-1/2 bg-destructive"
                style={{ left: `${zero - drawdownWidth}%`, width: `${drawdownWidth}%` }}
              />
              <span
                className="absolute top-1/2 h-2 -translate-y-1/2 bg-success"
                style={{ left: `${zero}%`, width: `${returnWidth}%` }}
              />
              <span
                className="absolute inset-y-0 border-l border-border"
                style={{ left: `${zero}%` }}
              />
            </div>
            <div className="relative mt-1 h-4 text-xs text-muted-foreground">
              <span className="absolute left-0">{formatPercent(scaleMin)}</span>
              <span className="absolute -translate-x-1/2" style={{ left: `${zero}%` }}>
                0
              </span>
              <span className="absolute right-0">{formatPercent(scaleMax)}</span>
            </div>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function tradeDay(trade: BacktestTrade | undefined): string {
  return trade === undefined ? '' : (trade.openedAt.split(',')[0] ?? '');
}

/** Labels under the account value chart: first, middle, and last trade. */
function tradeAxisLabels(trades: BacktestTrade[]): string[] {
  const first = trades[0];
  const last = trades[trades.length - 1];
  if (first === undefined || last === undefined) return [];
  const middle = trades[Math.floor((trades.length - 1) / 2)];
  const labels = [`Trade ${String(first.index)} · ${tradeDay(first)}`];
  if (middle !== undefined && middle !== first && middle !== last) {
    labels.push(`Trade ${String(middle.index)}`);
  }
  if (last !== first) labels.push(`Trade ${String(last.index)} · ${tradeDay(last)}`);
  return labels;
}

function EquityCard({ result }: { result: BacktestResultSummary }) {
  const { equityContainerRef, drawdownContainerRef } = useEquityDrawdownChart(result.equityCurve);

  return (
    <section
      aria-labelledby="backtest-equity-heading"
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <h3 id="backtest-equity-heading" className="mr-auto text-base font-semibold">
          Account value and drawdown
        </h3>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-4 border-t-2 border-foreground" aria-hidden="true" />
          Account value (USD)
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-block w-4 border-t-2 border-dashed border-muted-foreground"
            aria-hidden="true"
          />
          Buy &amp; hold
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-3 bg-destructive/45" aria-hidden="true" />
          Drop from previous peak
        </span>
      </div>
      <div
        ref={equityContainerRef}
        role="img"
        aria-label="Account value and buy-and-hold value over the backtest period"
        className="w-full min-w-0"
      />
      <div
        ref={drawdownContainerRef}
        role="img"
        aria-label="Drawdown from the previous peak in USD"
        className="w-full min-w-0"
      />
      <div className="flex justify-between pr-16 text-xs text-muted-foreground">
        {tradeAxisLabels(result.trades).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  );
}

/** How many hours the candles cover, and how many trades open inside them. */
function priceWindow(result: BacktestResultSummary): { hours: number; trades: number } | null {
  const first = result.priceSeries[0];
  const last = result.priceSeries[result.priceSeries.length - 1];
  const before = result.priceSeries[result.priceSeries.length - 2];
  if (first === undefined || last === undefined) return null;
  const end = last.timeSec + (before === undefined ? 0 : last.timeSec - before.timeSec);
  return {
    hours: Math.round((end - first.timeSec) / 3600),
    trades: result.trades.filter(
      (trade) => trade.openedTimeSec >= first.timeSec && trade.openedTimeSec < end,
    ).length,
  };
}

function PriceCard({ run, result }: { run: BacktestRunDetail; result: BacktestResultSummary }) {
  const shown = priceWindow(result);
  const [fullScreen, setFullScreen] = useState(false);
  const { containerRef } = usePriceTradesChart({
    priceSeries: result.priceSeries,
    trades: result.trades,
    supportLevel: result.supportLevel,
    resistanceLevel: result.resistanceLevel,
    fullScreen,
    onExitFullScreen: () => {
      setFullScreen(false);
    },
  });
  const ma20 = latestValue(result.priceSeries, 'ma20');
  const ma50 = latestValue(result.priceSeries, 'ma50');
  const toggleLabel = fullScreen ? 'Exit full screen' : 'Full screen';

  return (
    <section
      aria-labelledby="backtest-price-heading"
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-5',
        fullScreen && 'fixed inset-0 z-50 overflow-auto rounded-none',
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <h3 id="backtest-price-heading" className="text-base font-semibold">
          Price and trades
        </h3>
        <span className="text-xs text-muted-foreground">
          MA(20){' '}
          <span className="font-semibold text-info">{ma20 === null ? '—' : formatPrice(ma20)}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          MA(50){' '}
          <span className="font-semibold text-warning">
            {ma50 === null ? '—' : formatPrice(ma50)}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          Support{' '}
          <span className="font-semibold text-success">{formatPrice(result.supportLevel)}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Resistance{' '}
          <span className="font-semibold text-destructive">
            {formatPrice(result.resistanceLevel)}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={fullScreen}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="ml-auto"
          onClick={() => {
            setFullScreen((current) => !current);
          }}
        >
          {fullScreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
        </Button>
      </div>
      <div
        ref={containerRef}
        role="img"
        aria-label={`Candles for ${run.pair} ${run.timeframe} with MA(20), MA(50), support, resistance and trade markers`}
        className="w-full min-w-0"
      />
      {shown === null || shown.trades === result.totalTrades ? null : (
        <p className="text-xs text-muted-foreground">
          Shows the first {shown.hours} h of the run: {shown.trades} of {result.totalTrades} trades.
          The table below lists every trade.
        </p>
      )}
    </section>
  );
}

function CostsCard({ run, result }: { run: BacktestRunDetail; result: BacktestResultSummary }) {
  const perTradeFee = result.totalTrades === 0 ? 0 : result.totalFeeUsd / result.totalTrades;
  const perTradeSlippage =
    result.totalTrades === 0 ? 0 : result.totalSlippageUsd / result.totalTrades;

  return (
    <section
      aria-labelledby="backtest-costs-heading"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5"
    >
      <h3 id="backtest-costs-heading" className="text-base font-semibold">
        Effect of trading costs
      </h3>
      <table className="max-w-xl border-collapse text-sm">
        <tbody>
          <tr className="border-b">
            <td className="py-2">Gross P/L before costs</td>
            <td className={cn('py-2 text-right font-semibold', pnlColor(result.grossPnlUsd))}>
              {formatUsd(result.grossPnlUsd)} USD
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              Fees{' '}
              <span className="text-muted-foreground">
                {result.totalTrades} trades × {usd.format(perTradeFee)} ({run.feePercent}%)
              </span>
            </td>
            <td className="py-2 text-right font-semibold text-destructive">
              {formatUsd(-result.totalFeeUsd)} USD
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              Slippage{' '}
              <span className="text-muted-foreground">
                {result.totalTrades} trades × {usd.format(perTradeSlippage)} ({run.slippageBps} bps)
              </span>
            </td>
            <td className="py-2 text-right font-semibold text-destructive">
              {formatUsd(-result.totalSlippageUsd)} USD
            </td>
          </tr>
          <tr>
            <td className="py-2 font-semibold">Net P/L</td>
            <td className={cn('py-2 text-right font-semibold', pnlColor(result.netPnlUsd))}>
              {formatUsd(result.netPnlUsd)} USD
            </td>
          </tr>
        </tbody>
      </table>
      <p
        role="note"
        className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm leading-relaxed"
      >
        In this run, costs accounted for{' '}
        <strong>{percent.format(result.costShareOfGrossPercent)}%</strong> of gross P/L. Review the
        fee and slippage assumptions before comparing strategies.
      </p>
    </section>
  );
}

function AssumptionsCard({ assumptions }: { assumptions: string[] }) {
  return (
    <section
      aria-labelledby="backtest-assumptions-heading"
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-5"
    >
      <h3 id="backtest-assumptions-heading" className="text-base font-semibold">
        Assumptions
      </h3>
      <ul className="flex flex-col">
        {assumptions.map((assumption) => (
          <li
            key={assumption}
            className="flex items-center gap-3 border-b py-2 text-sm last:border-b-0"
          >
            <Check aria-hidden="true" className="size-4 shrink-0 text-success" />
            {assumption}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface BacktestResultsContentProps {
  metaPrefix: string | null;
  run: BacktestRunDetail;
  result: BacktestResultSummary;
  isStale: boolean;
  runDisabled: boolean;
  onRunAgain: () => void;
  onRevertInputs: () => void;
}

function BacktestResultsContent({
  metaPrefix,
  run,
  result,
  isStale,
  runDisabled,
  onRunAgain,
  onRevertInputs,
}: BacktestResultsContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {isStale ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
        >
          <span className="flex-1 basis-64">
            <strong className="font-semibold">Inputs changed since this run.</strong> These results
            are for the settings shown above them. Run the backtest again to update.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={runDisabled}
            onClick={onRunAgain}
          >
            Run again
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRevertInputs}>
            Revert inputs
          </Button>
        </div>
      ) : null}

      <div className={cn('flex flex-col gap-4', isStale && 'opacity-60')}>
        <Summary run={run} result={result} metaPrefix={metaPrefix} />
        <EquityCard result={result} />
        <PriceCard run={run} result={result} />
        <BacktestTradesTable trades={result.trades} />
        <div className="flex flex-wrap gap-4">
          <div className="min-w-80 flex-[1.3]">
            <CostsCard run={run} result={result} />
          </div>
          <div className="min-w-72 flex-1">
            <AssumptionsCard assumptions={result.assumptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The completed-run results: summary, charts, trades, costs, and assumptions. */
export function BacktestResultsSection({
  run,
  metaPrefix = null,
  isStale = false,
  runDisabled = false,
  onRunAgain,
  onRevertInputs,
}: {
  run: BacktestRunDetail;
  /** Text before the run ID in the results header; null shows a plain "Results" heading. */
  metaPrefix?: string | null;
  isStale?: boolean;
  runDisabled?: boolean;
  onRunAgain?: () => void;
  onRevertInputs?: () => void;
}): JSX.Element {
  const result = run.result;
  if (result === null) return <></>;
  return (
    <BacktestResultsContent
      metaPrefix={metaPrefix}
      run={run}
      result={result}
      isStale={isStale}
      runDisabled={runDisabled}
      onRunAgain={onRunAgain ?? (() => undefined)}
      onRevertInputs={onRevertInputs ?? (() => undefined)}
    />
  );
}
