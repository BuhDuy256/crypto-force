import { useState } from 'react';
import type { MarketPair, MarketTimeframe } from '@crypto-force/shared';

export function useRealtimeWorkspace() {
  const [pair, setPair] = useState<MarketPair>('BTCUSDT');
  const [chartCount, setChartCount] = useState<1 | 2 | 4>(4);
  const [slots, setSlots] = useState<{ id: number; timeframe: MarketTimeframe }[]>([
    // Default selection: BTCUSDT on 4 charts at 5m, 15m, 1h, 4h (docs/UCs/market-data.md, MK-31).
    { id: 1, timeframe: '5m' },
    { id: 2, timeframe: '15m' },
    { id: 3, timeframe: '1h' },
    { id: 4, timeframe: '4h' },
  ]);
  function setTimeframe(id: number, timeframe: MarketTimeframe) {
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, timeframe } : slot)));
  }
  return {
    pair,
    setPair,
    chartCount,
    setChartCount,
    slots: slots.slice(0, chartCount),
    setTimeframe,
  };
}
