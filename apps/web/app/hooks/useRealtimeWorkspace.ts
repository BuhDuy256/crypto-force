import { useState } from 'react';
import type { MarketPair, MarketTimeframe } from '@crypto-force/shared';

export function useRealtimeWorkspace() {
  const [pair, setPair] = useState<MarketPair>('BTCUSDT');
  const [chartCount, setChartCount] = useState<1 | 2 | 4>(4);
  const [slots, setSlots] = useState<{ id: number; timeframe: MarketTimeframe }[]>([
    { id: 1, timeframe: '1m' },
    { id: 2, timeframe: '5m' },
    { id: 3, timeframe: '15m' },
    { id: 4, timeframe: '1h' },
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
