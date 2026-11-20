import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import type { CandleHistory } from '@crypto-force/shared';
import { toChartSeries } from '~/utils/market-chart';

export function useCandlestickChart(history: CandleHistory) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instance = useRef<{
    chart: IChartApi;
    candles: ISeriesApi<'Candlestick'>;
    volume: ISeriesApi<'Histogram'>;
    ma20: ISeriesApi<'Line'>;
  } | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const style = getComputedStyle(container);
    const chart = createChart(container, {
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: style.backgroundColor },
        textColor: style.color,
        attributionLogo: true,
      },
      timeScale: { timeVisible: true },
      grid: {
        vertLines: { color: style.getPropertyValue('--border').trim() },
        horzLines: { color: style.getPropertyValue('--border').trim() },
      },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: style.getPropertyValue('--success').trim(),
      downColor: style.getPropertyValue('--destructive').trim(),
      wickUpColor: style.getPropertyValue('--success').trim(),
      wickDownColor: style.getPropertyValue('--destructive').trim(),
      borderVisible: false,
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      color: style.getPropertyValue('--info').trim(),
      priceScaleId: 'volume',
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.25 } });
    const ma20 = chart.addSeries(LineSeries, {
      color: style.getPropertyValue('--warning').trim(),
      lineWidth: 2,
    });
    instance.current = { chart, candles, volume, ma20 };
    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.remove();
      instance.current = null;
    };
  }, []);
  useEffect(() => {
    if (!instance.current) return;
    const series = toChartSeries(history);
    instance.current.candles.setData(series.candles);
    instance.current.volume.setData(series.volume);
    instance.current.ma20.setData(series.ma20);
    instance.current.chart.timeScale().fitContent();
  }, [history]);
  return containerRef;
}
