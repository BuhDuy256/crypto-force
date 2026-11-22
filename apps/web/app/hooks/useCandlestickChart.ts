import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import { marketPairPriceDecimals, type CandleHistory } from '@crypto-force/shared';
import { formatDateTime, toChartSeries } from '~/utils/market-chart';

/** Chart time values are UTC seconds (toChartSeries); labels use the device time zone (MK-43). */
function timeLabel(time: Time, options: Intl.DateTimeFormatOptions) {
  return typeof time === 'number'
    ? new Intl.DateTimeFormat('en-US', { hourCycle: 'h23', ...options }).format(time * 1000)
    : '';
}

/**
 * Draws the visible candles, volume and MA(20) of one history. Returns the open time of the candle
 * that the pointer or the keyboard selected, so the card can show its values (MK-41).
 */
export function useCandlestickChart(history: CandleHistory) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instance = useRef<{
    chart: IChartApi;
    candles: ISeriesApi<'Candlestick'>;
    volume: ISeriesApi<'Histogram'>;
    ma20: ISeriesApi<'Line'>;
  } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedTime = useRef<number | null>(null);
  const selection = useRef<string | null>(null);
  const series = useRef<ReturnType<typeof toChartSeries>>({ candles: [], volume: [], ma20: [] });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    selection.current = null;
    const style = getComputedStyle(container);
    const chart = createChart(container, {
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: style.backgroundColor },
        textColor: style.color,
        attributionLogo: true,
      },
      localization: {
        timeFormatter: (time: Time) => formatDateTime(Number(time) * 1000),
      },
      timeScale: {
        timeVisible: true,
        tickMarkFormatter: (time: Time) =>
          timeLabel(time, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      },
      grid: {
        vertLines: { color: style.getPropertyValue('--border').trim() },
        horzLines: { color: style.getPropertyValue('--border').trim() },
      },
    });
    // Rising candles have an empty body and falling candles a filled body, so the direction does
    // not depend on color alone (MK-49).
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: 'rgba(0, 0, 0, 0)',
      downColor: style.getPropertyValue('--destructive').trim(),
      borderVisible: true,
      borderUpColor: style.getPropertyValue('--success').trim(),
      borderDownColor: style.getPropertyValue('--destructive').trim(),
      wickUpColor: style.getPropertyValue('--success').trim(),
      wickDownColor: style.getPropertyValue('--destructive').trim(),
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
    chart.subscribeCrosshairMove((param) => {
      selectedTime.current = typeof param.time === 'number' ? param.time * 1000 : null;
      setSelected(selectedTime.current);
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
    const key = `${history.pair}:${history.timeframe}`;
    const sameSelection = selection.current === key;
    const timeScale = instance.current.chart.timeScale();
    const range = timeScale.getVisibleRange();
    const logicalRange = timeScale.getVisibleLogicalRange();
    const previousPoints = series.current.candles;
    const lastTime = previousPoints.at(-1)?.time;
    const followsLast =
      range && typeof range.to === 'number' && lastTime !== undefined && range.to >= lastTime;
    const selectedBefore = selectedTime.current;
    const digits = marketPairPriceDecimals[history.pair];
    const priceFormat = { type: 'price', precision: digits, minMove: 10 ** -digits } as const;
    series.current = toChartSeries(history);
    instance.current.candles.applyOptions({ priceFormat });
    instance.current.ma20.applyOptions({ priceFormat });
    instance.current.candles.setData(series.current.candles);
    instance.current.volume.setData(series.current.volume);
    instance.current.ma20.setData(series.current.ma20);
    performance.mark('market-data:apply', {
      detail: { pair: history.pair, timeframe: history.timeframe, ...series.current },
    });
    performance.clearMarks('market-data:apply');
    if (!sameSelection) {
      timeScale.fitContent();
      instance.current.chart.clearCrosshairPosition();
      selectedTime.current = null;
      setSelected(null);
    } else {
      if (followsLast && logicalRange) {
        const shift = series.current.candles.length - previousPoints.length;
        timeScale.setVisibleLogicalRange({
          from: logicalRange.from + shift,
          to: logicalRange.to + shift,
        });
      } else if (logicalRange && lastTime !== undefined) {
        const anchor = series.current.candles.findIndex((point) => point.time === lastTime);
        if (anchor >= 0) {
          const shift = anchor - (previousPoints.length - 1);
          timeScale.setVisibleLogicalRange({
            from: logicalRange.from + shift,
            to: logicalRange.to + shift,
          });
        } else if (range) {
          timeScale.setVisibleRange(range);
        }
      }
      const point = series.current.candles.find((item) => item.time * 1000 === selectedBefore);
      if (point) {
        instance.current.chart.setCrosshairPosition(
          point.close,
          point.time,
          instance.current.candles,
        );
        selectedTime.current = selectedBefore;
        setSelected(selectedBefore);
      } else {
        instance.current.chart.clearCrosshairPosition();
        selectedTime.current = null;
        setSelected(null);
      }
    }
    selection.current = key;
  }, [history]);

  /**
   * Keyboard access to the chart functions (MK-46): Left/Right/Home/End select a candle, + and -
   * zoom in and out. The visible range follows the selected candle.
   */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = instance.current;
    const points = series.current.candles;
    if (!current || points.length === 0) return;
    const timeScale = current.chart.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if ((event.key === '+' || event.key === '=' || event.key === '-') && range) {
      event.preventDefault();
      const center = (range.from + range.to) / 2;
      const half = ((range.to - range.from) / 2) * (event.key === '-' ? 1.5 : 1 / 1.5);
      timeScale.setVisibleLogicalRange({ from: center - half, to: center + half });
      return;
    }
    const index = points.findIndex((point) => point.time * 1000 === selected);
    const last = points.length - 1;
    const next =
      event.key === 'ArrowLeft'
        ? Math.max(0, (index === -1 ? last : index) - 1)
        : event.key === 'ArrowRight'
          ? Math.min(last, index === -1 ? last : index + 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    const point = points[next];
    if (!point) return;
    if (range && (next < range.from || next > range.to)) {
      const shift = next < range.from ? next - range.from : next - range.to;
      timeScale.setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift });
    }
    current.chart.setCrosshairPosition(point.close, point.time, current.candles);
    selectedTime.current = point.time * 1000;
    setSelected(selectedTime.current);
  }

  return { containerRef, selected, onKeyDown };
}
