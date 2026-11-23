import { marketPairSchema, type MarketPair } from '@crypto-force/shared';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import { Button } from '~/components/ui/button';
import type { RealtimeConnectionState } from '~/hooks/useRealtimeWorkspace';
import { formatDateTime } from '~/utils/market-chart';

function connectionLabel(
  state: RealtimeConnectionState,
  pausedAt: number | null,
  disconnectedAt: number | null,
): string {
  switch (state) {
    case 'live':
      return 'Live · Đang trực tiếp';
    case 'syncing':
      return 'Syncing · Đang đồng bộ';
    case 'stale':
      return 'Stale data · Dữ liệu cũ';
    case 'reconnecting':
      return disconnectedAt !== null
        ? `Disconnected at ${formatDateTime(disconnectedAt)}, retrying · Mất kết nối, đang thử lại`
        : 'Disconnected, retrying · Mất kết nối, đang thử lại';
    case 'disconnected':
      return disconnectedAt !== null
        ? `Disconnected at ${formatDateTime(disconnectedAt)} · Mất kết nối hoàn toàn`
        : 'Disconnected · Mất kết nối hoàn toàn';
    case 'unavailable':
      return 'Data source temporarily unavailable · Nguồn tạm thời không khả dụng';
    case 'partial_sync':
      return 'Sync incomplete · Đồng bộ chưa xong';
    case 'limit_exceeded':
      return 'Connection limit reached · Vượt giới hạn tab trực tiếp';
    case 'paused':
      return pausedAt !== null
        ? `Paused at ${formatDateTime(pausedAt)} · Đã tạm dừng`
        : 'Paused · Đã tạm dừng';
  }
}

export function RealtimeToolbar({
  pair,
  onPairChange,
  chartCount,
  onChartCountChange,
  live,
  pausedAt,
  connectionState = live ? 'live' : 'paused',
  disconnectedAt = null,
  isConnectingManual = false,
  onToggleLive,
  onReconnect,
  onResync,
}: {
  pair: MarketPair;
  onPairChange: (pair: MarketPair) => void;
  chartCount: 1 | 2 | 4;
  onChartCountChange: (count: 1 | 2 | 4) => void;
  live: boolean;
  pausedAt: number | null;
  connectionState?: RealtimeConnectionState;
  disconnectedAt?: number | null;
  isConnectingManual?: boolean;
  onToggleLive: () => void;
  onReconnect?: () => void;
  onResync?: () => void;
}) {
  const statusText = connectionLabel(connectionState, pausedAt, disconnectedAt);
  const showReconnect =
    live && (connectionState === 'reconnecting' || connectionState === 'disconnected');
  const showResync = live && connectionState === 'partial_sync';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Realtime</h1>
        <p className="text-sm text-muted-foreground">Candlesticks, volume and MA(20)</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div
          data-testid="realtime-connection-status"
          className="flex flex-wrap items-center gap-2 text-sm"
        >
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {statusText}
          </p>
          <Button type="button" onClick={onToggleLive} variant="outline" size="sm">
            {live ? 'Pause · Tạm dừng' : 'Resume · Tiếp tục'}
          </Button>
          {showReconnect && onReconnect ? (
            <Button
              type="button"
              onClick={onReconnect}
              disabled={isConnectingManual}
              variant="outline"
              size="sm"
            >
              Reconnect · Kết nối lại
            </Button>
          ) : null}
          {showResync && onResync ? (
            <Button type="button" onClick={onResync} variant="outline" size="sm">
              Resync · Đồng bộ lại
            </Button>
          ) : null}
        </div>
        <Button role="switch" aria-checked={live} onClick={onToggleLive} variant="outline">
          Live updates
        </Button>
        <div className="flex items-center gap-2">
          <span id="pair-label" className="text-sm">
            Pair
          </span>
          <Select
            value={pair}
            onValueChange={(value) => {
              onPairChange(marketPairSchema.parse(value));
            }}
          >
            <SelectTrigger aria-labelledby="pair-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {marketPairSchema.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span id="chart-count-label" className="text-sm">
            Charts
          </span>
          <ToggleGroup
            type="single"
            value={String(chartCount)}
            onValueChange={(value) => {
              if (value === '1' || value === '2' || value === '4')
                onChartCountChange(Number(value) as 1 | 2 | 4);
            }}
            variant="outline"
            aria-labelledby="chart-count-label"
          >
            {[1, 2, 4].map((count) => (
              <ToggleGroupItem
                key={count}
                value={String(count)}
                aria-label={`${count} chart${count === 1 ? '' : 's'}`}
              >
                {count}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
