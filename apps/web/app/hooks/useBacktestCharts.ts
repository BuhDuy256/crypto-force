import { useEffect, useRef, type RefObject } from 'react';
import {
  AreaSeries,
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
const PRICE_HEIGHT = 320;
const PRICE_HEIGHT_FULL_SCREEN = 520;

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
    drawdownArea: ISeriesApi<'Area'>;
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
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
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
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
    });
    const drawdownArea = drawdown.addSeries(AreaSeries, {
      lineColor: token(drawdownStyle, '--destructive'),
      topColor: `${token(drawdownStyle, '--destructive')}73`,
      bottomColor: `${token(drawdownStyle, '--destructive')}00`,
      lineWidth: 1,
    });

    const observer = new ResizeObserver(() => {
      equity.applyOptions({ width: equityContainer.clientWidth });
      drawdown.applyOptions({ width: drawdownContainer.clientWidth });
    });
    observer.observe(equityContainer);
    observer.observe(drawdownContainer);
    charts.current = { equity, drawdown, accountValue, buyAndHold, drawdownArea };

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
    current.equity.timeScale().fitContent();
    current.drawdown.timeScale().fitContent();
  }, [equityCurve]);

  return { equityContainerRef, drawdownContainerRef };
}

function tradeMarkers(trades: BacktestTrade[], style: CSSStyleDeclaration): SeriesMarker<Time>[] {
  const success = token(style, '--success');
  const destructive = token(style, '--destructive');
  const info = token(style, '--info');
  const markers: SeriesMarker<Time>[] = [];
  for (const trade of trades) {
    const long = trade.side === 'LONG';
    markers.push({
      time: toChartTime(trade.openedTimeSec),
      position: long ? 'belowBar' : 'aboveBar',
      color: long ? success : destructive,
      shape: long ? 'arrowUp' : 'arrowDown',
      text: `${trade.side} entry`,
    });
    markers.push({
      time: toChartTime(trade.closedTimeSec),
      position: 'inBar',
      color: info,
      shape: 'circle',
      text: 'Exit',
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
      upColor: token(style, '--card'),
      downColor: token(style, '--destructive'),
      borderVisible: true,
      borderUpColor: token(style, '--success'),
      borderDownColor: token(style, '--destructive'),
      wickUpColor: token(style, '--success'),
      wickDownColor: token(style, '--destructive'),
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      color: token(style, '--info'),
      priceScaleId: 'volume',
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.25 } });
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
    current.volume.setData(
      points.map((point) => ({ time: toChartTime(point.timeSec), value: point.volume })),
    );
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
    const firstTrade = trades[0];
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

    current.markers.setMarkers(tradeMarkers(trades, style));
    current.chart.timeScale().fitContent();
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
