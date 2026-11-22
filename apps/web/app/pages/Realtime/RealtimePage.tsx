import { useRealtimeWorkspace } from '~/hooks/useRealtimeWorkspace';
import { cn } from '~/utils/cn';
import { MarketChartCard } from './components/MarketChartCard';
import { MarketSummary } from './components/MarketSummary';
import { RealtimeToolbar } from './components/RealtimeToolbar';

export function RealtimePage() {
  const workspace = useRealtimeWorkspace();
  return (
    <section className="mx-auto flex w-full max-w-page flex-col gap-6 p-4 sm:p-7">
      {import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === 'true' ? (
        <p className="text-sm text-muted-foreground">Development preview · Mock market data</p>
      ) : null}
      <RealtimeToolbar
        pair={workspace.pair}
        onPairChange={workspace.setPair}
        chartCount={workspace.chartCount}
        onChartCountChange={workspace.setChartCount}
        live={workspace.live}
        pausedAt={workspace.pausedAt}
        onToggleLive={workspace.toggleLive}
      />
      {/* Chart times use the device time zone; the page names it (docs/UCs/market-data.md, MK-43). */}
      <p className="text-xs text-muted-foreground">
        Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </p>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className={cn('grid min-w-0 gap-4', workspace.chartCount > 1 && 'lg:grid-cols-2')}>
          {workspace.slots.map((slot) => (
            <MarketChartCard
              key={slot.id}
              chartId={slot.id}
              pair={workspace.pair}
              timeframe={slot.timeframe}
              onTimeframeChange={workspace.setTimeframe}
              live={workspace.live}
            />
          ))}
        </div>
        <MarketSummary pair={workspace.pair} live={workspace.live} />
      </div>
    </section>
  );
}
