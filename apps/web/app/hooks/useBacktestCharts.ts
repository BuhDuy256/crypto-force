import { useEffect, useRef, type RefObject } from 'react';
import {
  BaselineSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts';
import type { BacktestEquityPoint, BacktestPriceCandle, BacktestTrade } from '@crypto-force/shared';

const EQUITY_HEIGHT = 200;
const DRAWDOWN_HEIGHT = 90;
const PRICE_HEIGHT = 380;
const PRICE_HEIGHT_FULL_SCREEN = 620;
const VOLUME_PANE_HEIGHT = 70;
const usd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The deepest drop from a previous peak, with the indexes of that peak and of its low. */
function deepestDrop(points: BacktestEquityPoint[]): { peak: number; trough: number } | null {
  let trough = -1;
  for (let index = 0; index < points.length; index += 1) {
    const value = points[index]?.drawdownUsd ?? 0;
    if (value < 0 && (trough < 0 || value < (points[trough]?.drawdownUsd ?? 0))) trough = index;
  }
  if (trough < 0) return null;
  let peak = 0;
  for (let index = 0; index <= trough; index += 1) {
    if ((points[index]?.accountValueUsd ?? 0) >= (points[peak]?.accountValueUsd ?? 0)) peak = index;
  }
  return { peak, trough };
}

function toChartTime(timeSec: number): Time {
  return timeSec as Time;
}

function token(style: CSSStyleDeclaration, name: string): string {
  return style.getPropertyValue(name).trim();
}

/** Draws the account value, the buy-and-hold baseline, and the drawdown from the previous peak. */
export function useEquityDrawdownChart(equityCurve: BacktestEquityPoint[]): {
  equityContainerRef: RefObject<HTMLDivElement | null>;
  drawdownContainerRef: RefObject<HTMLDivElement | null>;
} {
  const equityContainerRef = useRef<HTMLDivElement>(null);
  const drawdownContainerRef = useRef<HTMLDivElement>(null);
  const charts = useRef<{
    equity: IChartApi;
    drawdown: IChartApi;
    accountValue: ISeriesApi<'Line'>;
    buyAndHold: ISeriesApi<'Line'>;
    drawdownArea: ISeriesApi<'Baseline'>;
    equityMarkers: ISeriesMarkersPluginApi<Time>;
    drawdownMarkers: ISeriesMarkersPluginApi<Time>;
    style: CSSStyleDeclaration;
  } | null>(null);

  useEffect(() => {
    const equityContainer = equityContainerRef.current;
    const drawdownContainer = drawdownContainerRef.current;
    if (!equityContainer || !drawdownContainer) return;
    const equityStyle = getComputedStyle(equityContainer);
    const drawdownStyle = getComputedStyle(drawdownContainer);

    const equity = createChart(equityContainer, {
      height: EQUITY_HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: token(equityStyle, '--card') },
        textColor: token(equityStyle, '--muted-foreground'),
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: token(equityStyle, '--border') },
        horzLines: { color: token(equityStyle, '--border') },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });
    const accountValue = equity.addSeries(LineSeries, {
      color: token(equityStyle, '--foreground'),
      lineWidth: 2,
    });
    const buyAndHold = equity.addSeries(LineSeries, {
      color: token(equityStyle, '--muted-foreground'),
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });

    const drawdown = createChart(drawdownContainer, {
      height: DRAWDOWN_HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: token(drawdownStyle, '--card') },
        textColor: token(drawdownStyle, '--muted-foreground'),
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: token(drawdownStyle, '--border') },
        horzLines: { color: token(drawdownStyle, '--border') },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });
    const destructive = token(drawdownStyle, '--destructive');
    const drawdownArea = drawdown.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: 'transparent',
      topFillColor1: 'transparent',
      topFillColor2: 'transparent',
      bottomLineColor: destructive,
      bottomFillColor1: `${destructive}73`,
      bottomFillColor2: `${destructive}73`,
      lineWidth: 1,
      priceLineVisible: false,
    });
    const equityMarkers = createSeriesMarkers(accountValue, []);
    const drawdownMarkers = createSeriesMarkers(drawdownArea, []);

    const observer = new ResizeObserver(() => {
      equity.applyOptions({ width: equityContainer.clientWidth });
      drawdown.applyOptions({ width: drawdownContainer.clientWidth });
    });
    observer.observe(equityContainer);
    observer.observe(drawdownContainer);
    charts.current = {
      equity,
      drawdown,
      accountValue,
      buyAndHold,
      drawdownArea,
      equityMarkers,
      drawdownMarkers,
      style: equityStyle,
    };

    return () => {
      observer.disconnect();
      equity.remove();
      drawdown.remove();
      charts.current = null;
    };
  }, []);

  useEffect(() => {
    const current = charts.current;
    if (!current) return;
    const points = [...equityCurve].sort((left, right) => left.timeSec - right.timeSec);
    current.accountValue.setData(
      points.map((point) => ({
        time: toChartTime(point.timeSec),
        value: point.accountValueUsd,
      })),
    );
    current.buyAndHold.setData(
      points.map((point) => ({ time: toChartTime(point.timeSec), value: point.buyAndHoldUsd })),
    );
    current.drawdownArea.setData(
      points.map((point) => ({ time: toChartTime(point.timeSec), value: point.drawdownUsd })),
    );
    const drop = deepestDrop(points);
    const peakPoint = drop === null ? undefined : points[drop.peak];
    const troughPoint = drop === null ? undefined : points[drop.trough];
    if (peakPoint !== undefined && troughPoint !== undefined) {
      const muted = token(current.style, '--muted-foreground');
      const destructive = token(current.style, '--destructive');
      current.equityMarkers.setMarkers([
        {
          time: toChartTime(peakPoint.timeSec),
          position: 'aboveBar',
          color: muted,
          shape: 'circle',
          size: 0.5,
          text: `peak ${usd.format(peakPoint.accountValueUsd)}`,
        },
        {
          time: toChartTime(troughPoint.timeSec),
          position: 'belowBar',
          color: destructive,
          shape: 'circle',
          size: 0.5,
          text: `low ${usd.format(troughPoint.accountValueUsd)}`,
        },
      ]);
      current.drawdownMarkers.setMarkers([
        {
          time: toChartTime(troughPoint.timeSec),
          position: 'belowBar',
          color: destructive,
          shape: 'circle',
          size: 0,
          text: `\u2212${usd.format(Math.abs(troughPoint.drawdownUsd))} USD`,
        },
      ]);
    } else {
      current.equityMarkers.setMarkers([]);
      current.drawdownMarkers.setMarkers([]);
    }
    current.equity.timeScale().fitContent();
    current.drawdown.timeScale().fitContent();
  }, [equityCurve]);

  return { equityContainerRef, drawdownContainerRef };
}

/** The start time of the candle that contains the given time, or null outside the candles. */
function candleTimeFor(candleTimes: number[], timeSec: number): number | null {
  const first = candleTimes[0];
  const last = candleTimes[candleTimes.length - 1];
  if (first === undefined || last === undefined || timeSec < first) return null;
  const step = candleTimes.length > 1 ? last - (candleTimes[candleTimes.length - 2] ?? last) : 0;
  if (timeSec >= last + step) return null;
  let found = first;
  for (const candleTime of candleTimes) {
    if (candleTime > timeSec) break;
    found = candleTime;
  }
  return found;
}

/** The trades whose entry falls inside the drawn candles. */
function tradesInCandles(trades: BacktestTrade[], candleTimes: number[]): BacktestTrade[] {
  return trades.filter((trade) => candleTimeFor(candleTimes, trade.openedTimeSec) !== null);
}

function tradeMarkers(
  trades: BacktestTrade[],
  candleTimes: number[],
  style: CSSStyleDeclaration,
): SeriesMarker<Time>[] {
  const success = token(style, '--success');
  const destructive = token(style, '--destructive');
  const info = token(style, '--info');
  const labelled = new Set<string>();
  const label = (key: string, text: string): string => {
    if (labelled.has(key)) return '';
    labelled.add(key);
    return text;
  };
  const markers: SeriesMarker<Time>[] = [];
  for (const trade of trades) {
    const openTime = candleTimeFor(candleTimes, trade.openedTimeSec);
    if (openTime === null) continue;
    const long = trade.side === 'LONG';
    markers.push({
      time: toChartTime(openTime),
      position: long ? 'belowBar' : 'aboveBar',
      color: long ? success : destructive,
      shape: long ? 'arrowUp' : 'arrowDown',
      text: label(trade.side, `${trade.side} entry`),
    });
    const closeTime = candleTimeFor(candleTimes, trade.closedTimeSec);
    if (closeTime === null) continue;
    markers.push({
      time: toChartTime(closeTime),
      position: 'inBar',
      color: info,
      shape: 'circle',
      size: 0.6,
      text: label('exit', 'Exit'),
    });
  }
  return markers.sort((left, right) => Number(left.time) - Number(right.time));
}

/** Draws the candles, volume, MA(20), MA(50), the price levels, and the trade markers. */
export function usePriceTradesChart(input: {
  priceSeries: BacktestPriceCandle[];
  trades: BacktestTrade[];
  supportLevel: number;
  resistanceLevel: number;
  fullScreen: boolean;
  onExitFullScreen: () => void;
}): { containerRef: RefObject<HTMLDivElement | null> } {
  const { priceSeries, trades, supportLevel, resistanceLevel, fullScreen, onExitFullScreen } =
    input;
  const containerRef = useRef<HTMLDivElement>(null);
  const instance = useRef<{
    chart: IChartApi;
    candles: ISeriesApi<'Candlestick'>;
    volume: ISeriesApi<'Histogram'>;
    ma20: ISeriesApi<'Line'>;
    ma50: ISeriesApi<'Line'>;
    markers: ISeriesMarkersPluginApi<Time>;
  } | null>(null);
  const priceLines = useRef<IPriceLine[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const style = getComputedStyle(container);
    const chart = createChart(container, {
      height: PRICE_HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: token(style, '--card') },
        textColor: token(style, '--muted-foreground'),
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: token(style, '--border') },
        horzLines: { color: token(style, '--border') },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: token(style, '--success'),
      downColor: token(style, '--destructive'),
      borderVisible: true,
      borderUpColor: token(style, '--success'),
      borderDownColor: token(style, '--destructive'),
      wickUpColor: token(style, '--success'),
      wickDownColor: token(style, '--destructive'),
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });
    const volume = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: 'volume' }, priceLineVisible: false, lastValueVisible: false },
      1,
    );
    chart.panes()[1]?.setHeight(VOLUME_PANE_HEIGHT);
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.08 } });
    const ma20 = chart.addSeries(LineSeries, {
      color: token(style, '--info'),
      lineWidth: 2,
      priceLineVisible: false,
    });
    const ma50 = chart.addSeries(LineSeries, {
      color: token(style, '--warning'),
      lineWidth: 2,
      priceLineVisible: false,
    });
    const markers = createSeriesMarkers(candles, []);
    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    observer.observe(container);
    instance.current = { chart, candles, volume, ma20, ma50, markers };

    return () => {
      observer.disconnect();
      chart.remove();
      instance.current = null;
      priceLines.current = [];
    };
  }, []);

  useEffect(() => {
    instance.current?.chart.applyOptions({
      height: fullScreen ? PRICE_HEIGHT_FULL_SCREEN : PRICE_HEIGHT,
    });
  }, [fullScreen]);

  useEffect(() => {
    const current = instance.current;
    if (!current) return;
    const container = containerRef.current;
    if (!container) return;
    const style = getComputedStyle(container);
    const points = [...priceSeries].sort((left, right) => left.timeSec - right.timeSec);

    current.candles.setData(
      points.map((point) => ({
        time: toChartTime(point.timeSec),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    );
    const volumeUp = `${token(style, '--success')}73`;
    const volumeDown = `${token(style, '--destructive')}73`;
    current.volume.setData(
      points.map((point) => ({
        time: toChartTime(point.timeSec),
        value: point.volume,
        color: point.close >= point.open ? volumeUp : volumeDown,
      })),
    );
    const candleTimes = points.map((point) => point.timeSec);
    const visibleTrades = tradesInCandles(trades, candleTimes);
    current.ma20.setData(
      points.flatMap((point) =>
        point.ma20 === null ? [] : [{ time: toChartTime(point.timeSec), value: point.ma20 }],
      ),
    );
    current.ma50.setData(
      points.flatMap((point) =>
        point.ma50 === null ? [] : [{ time: toChartTime(point.timeSec), value: point.ma50 }],
      ),
    );

    for (const line of priceLines.current) current.candles.removePriceLine(line);
    priceLines.current = [
      current.candles.createPriceLine({
        price: supportLevel,
        color: token(style, '--success'),
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Support',
      }),
      current.candles.createPriceLine({
        price: resistanceLevel,
        color: token(style, '--destructive'),
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Resistance',
      }),
    ];
    const firstTrade = visibleTrades[0];
    if (firstTrade !== undefined) {
      priceLines.current.push(
        current.candles.createPriceLine({
          price: firstTrade.stopLoss,
          color: token(style, '--destructive'),
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'Stop loss',
        }),
        current.candles.createPriceLine({
          price: firstTrade.takeProfit,
          color: token(style, '--success'),
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'Take profit',
        }),
      );
    }

    current.markers.setMarkers(tradeMarkers(visibleTrades, candleTimes, style));
    current.chart.timeScale().setVisibleLogicalRange({ from: -6, to: points.length + 1 });
  }, [priceSeries, trades, supportLevel, resistanceLevel]);

  useEffect(() => {
    if (!fullScreen) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onExitFullScreen();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [fullScreen, onExitFullScreen]);

  return { containerRef };
}
