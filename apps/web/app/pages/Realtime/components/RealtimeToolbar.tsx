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

export function RealtimeToolbar({
  pair,
  onPairChange,
  chartCount,
  onChartCountChange,
}: {
  pair: MarketPair;
  onPairChange: (pair: MarketPair) => void;
  chartCount: 1 | 2 | 4;
  onChartCountChange: (count: 1 | 2 | 4) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Realtime</h1>
        <p className="text-sm text-muted-foreground">Candlesticks, volume and MA(20)</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
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
