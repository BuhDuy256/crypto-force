import type {
  BacktestEquityPoint,
  BacktestPriceCandle,
  BacktestResultSummary,
  BacktestRun,
  BacktestTrade,
  StrategyLibraryItem,
  StrategyPreviewResponse,
  StrategySource,
} from '@crypto-force/shared';

const CAPITAL_USD = 100;
const GROSS_PNL_USD = 22.66;
const BASE_FEE_USD = 8.9;
const BASE_SLIPPAGE_USD = 5.34;
const BASE_FEE_PERCENT = 0.08;
const BASE_SLIPPAGE_BPS = 5;
const TOTAL_TRADES = 178;
const WINNING_TRADES = 96;

const MA_CROSSOVER_RULES = [
  'LONG when MA(20) crosses above MA(50); SHORT when it crosses below',
  'Stop loss and take profit from the strategy settings',
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function seedStrategyLibrary(): StrategyLibraryItem[] {
  return [
    {
      id: 'st-rsi-bb',
      kind: 'strategy',
      name: 'RSI_BB_LB_LONG_SL2_TP4',
      source: 'Written by you',
      inputMode: 'prompt',
      prompt:
        'When RSI is below 30 and price is under the lower Bollinger Band, go LONG. Stop loss 2%, take profit 4%.',
      url: null,
      tags: ['RSI', 'Bollinger', 'Mean Reversion', 'Long'],
      version: '1.0.0',
      createdAt: '20 May 2025, 10:42',
      updatedAt: '20 May 2025, 10:42',
      rules: [
        'LONG when RSI(14) is below 30 and the close is under the lower Bollinger Band (20, 2)',
        'Stop loss 2% below entry',
        'Take profit 4% above entry',
      ],
      blocks: null,
      voteMethod: null,
      weights: null,
      lastRunSummary: 'Failed · no candles for that period',
    },
    {
      id: 'st-macd',
      kind: 'strategy',
      name: 'MACD_Cross_TrendFollow',
      source: 'Imported from a link',
      inputMode: 'url',
      prompt: null,
      url: 'https://www.tradingview.com/script/abc123-example/',
      tags: ['MACD', 'Trend', 'Swing'],
      version: '1.2.1',
      createdAt: '19 May 2025, 16:30',
      updatedAt: '19 May 2025, 16:30',
      rules: [
        'LONG when the MACD line crosses above its signal line and the close is above EMA(200)',
        'Exit when the MACD line crosses back below its signal line',
      ],
      blocks: null,
      voteMethod: null,
      weights: null,
      lastRunSummary: 'Cancelled',
    },
    {
      id: 'cp-ma-rsi-sr',
      kind: 'composite',
      name: 'MA + RSI + S/R',
      source: 'Built in Discovery',
      inputMode: null,
      prompt: null,
      url: null,
      tags: ['Composite', 'Weighted vote'],
      version: '1.0.0',
      createdAt: '18 May 2025, 09:05',
      updatedAt: '18 May 2025, 09:05',
      rules: [
        'MA, RSI and Support / Resistance each vote BUY, SELL or HOLD on every candle',
        'Weighted vote (0.40 / 0.30 / 0.30) decides the signal',
      ],
      blocks: ['MA', 'RSI', 'Support / Resistance'],
      voteMethod: 'weighted',
      weights: [0.4, 0.3, 0.3],
      lastRunSummary: null,
    },
  ];
}

export function buildStrategyPreview(
  inputMode: 'prompt' | 'url',
  includeShort: boolean,
): StrategyPreviewResponse {
  const longRule =
    'LONG when RSI(14) is below 30 and the close is under the lower Bollinger Band (20, 2)';
  const shortRule =
    'SHORT when RSI(14) is above 70 and the close is over the upper Bollinger Band (20, 2)';
  const rules = [
    longRule,
    ...(includeShort ? [shortRule] : []),
    'Stop loss 2% below entry',
    'Take profit 4% above entry',
  ];
  const definition = {
    name: 'RSI_BB_LB_LONG_SL2_TP4',
    version: '1.0.0',
    description: 'LONG when RSI < 30 and price below Bollinger Lower Band. SL 2%, TP 4%.',
    indicators: [
      { name: 'RSI', period: 14 },
      { name: 'BollingerBands', period: 20, stdDev: 2 },
    ],
    conditions: {
      long: [
        { indicator: 'RSI', operator: '<', value: 30 },
        { indicator: 'Close', position: '<', indicatorRef: 'BB_Lower' },
      ],
      short: includeShort
        ? [
            { indicator: 'RSI', operator: '>', value: 70 },
            { indicator: 'Close', position: '>', indicatorRef: 'BB_Upper' },
          ]
        : [],
    },
    riskManagement: {
      stopLoss: { type: 'percent', value: 2 },
      takeProfit: { type: 'percent', value: 4 },
    },
    timeframe: '1h',
    applicability: { pairs: 'USDT_ALL', market: 'spot' },
  };
  const source: StrategySource = inputMode === 'url' ? 'Imported from a link' : 'Written by you';

  return {
    inputMode,
    source,
    rules,
    hasShortExample: includeShort,
    shortRuleText: includeShort ? shortRule : 'No SHORT rule in this example.',
    riskSummary: 'Stop loss 2% · take profit 4%',
    assumedTimeframe: '1h',
    assumedPairs: 'All USDT pairs, spot',
    assumptions: [
      'No timeframe given, so we used 1h.',
      'No pairs specified. This demo assumes all USDT spot pairs; confirm the intended markets before testing.',
      ...(includeShort
        ? [
            'A mirrored SHORT rule is shown as an example. Confirm whether short positions belong in this strategy.',
          ]
        : []),
    ],
    definitionJson: JSON.stringify(definition, null, 2),
    checks: [
      { title: 'Required fields', detail: 'None missing', passed: true },
      { title: 'Logic', detail: 'Consistent', passed: true },
      { title: 'Indicators', detail: 'All supported', passed: true },
    ],
  };
}

function interpolate(points: ReadonlyArray<readonly [number, number]>, index: number): number {
  for (let position = 1; position < points.length; position += 1) {
    const start = points[position - 1];
    const end = points[position];
    if (!start || !end) continue;
    if (index <= end[0]) {
      return start[1] + ((end[1] - start[1]) * (index - start[0])) / (end[0] - start[0]);
    }
  }
  const last = points[points.length - 1];
  return last ? last[1] : 0;
}

function buildEquityCurve(): BacktestEquityPoint[] {
  const waypoints: ReadonlyArray<readonly [number, number]> = [
    [0, 100],
    [7, 101.6],
    [14, 103.1],
    [19, 102.4],
    [24, 105.9],
    [31, 102.69],
    [37, 104.3],
    [46, 106.4],
    [53, 107.2],
    [59, 108.42],
  ];
  const peakAt = (index: number): number =>
    waypoints.reduce((peak, [point, value]) => (point <= index ? Math.max(peak, value) : peak), 0);

  return Array.from({ length: 60 }, (_, index) => {
    const accountValueUsd = round2(interpolate(waypoints, index));
    const peak = Math.max(peakAt(index), accountValueUsd);

    return {
      timeSec: 1746086400 + index * 3600,
      accountValueUsd,
      buyAndHoldUsd: round2(100 + (1.29 * index) / 59),
      drawdownUsd: round2(Math.min(0, accountValueUsd - peak)),
    };
  });
}

function buildPriceSeries(): BacktestPriceCandle[] {
  const closes = Array.from({ length: 60 }, (_, index) =>
    round2(68600 + Math.sin(index / 6) * 250 + index * 4),
  );

  return closes.map((close, index) => {
    const open = index === 0 ? 68100 : (closes[index - 1] ?? close);
    const window20 = closes.slice(Math.max(0, index - 19), index + 1);
    const window50 = closes.slice(Math.max(0, index - 49), index + 1);
    const mean = (values: number[]): number =>
      round2(values.reduce((sum, value) => sum + value, 0) / values.length);

    return {
      timeSec: 1746086400 + index * 3600,
      open,
      high: round2(Math.max(open, close) + 25),
      low: round2(Math.min(open, close) - 25),
      close,
      volume: round2(0.2 + ((index * 37) % 50) / 100),
      ma20: mean(window20),
      ma50: mean(window50),
    };
  });
}

function buildTrades(totalFeeUsd: number, totalSlippageUsd: number): BacktestTrade[] {
  const perTradeFee = round2(totalFeeUsd / 30);
  const perTradeSlippage = round2(totalSlippageUsd / 30);

  return Array.from({ length: 30 }, (_, offset) => {
    const index = offset + 1;
    const side = index % 3 === 0 ? 'SHORT' : 'LONG';
    const entryPrice = round2(68000 + ((index * 137) % 1200));
    const stopLoss = round2(entryPrice - 500);
    const takeProfit = round2(entryPrice + 1000);
    const exitPrice = round2(
      side === 'LONG'
        ? entryPrice + (index % 2 === 0 ? 1000 : -500)
        : entryPrice + (index % 2 === 0 ? 500 : -1000),
    );
    const pnlUsd = round2(index % 5 === 0 ? -0.67 : 0.45);

    return {
      index,
      openedAt: `01 May 2025, ${String(6 + (index % 18)).padStart(2, '0')}:15`,
      openedTimeSec: 1746086400 + index * 8400,
      closedTimeSec: 1746086400 + index * 8400 + 1800,
      side,
      pnlUsd,
      pnlPercent: round2((pnlUsd / CAPITAL_USD) * 100),
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      feeUsd: perTradeFee,
      slippageUsd: perTradeSlippage,
      heldDuration: `${1 + (index % 6)}h ${10 + (index % 5) * 7}m`,
    };
  });
}

export function createMockRunResult(
  feePercent: number,
  slippageBps: number,
): BacktestResultSummary {
  const totalFeeUsd = round2((BASE_FEE_USD * feePercent) / BASE_FEE_PERCENT);
  const totalSlippageUsd = round2((BASE_SLIPPAGE_USD * slippageBps) / BASE_SLIPPAGE_BPS);
  const netPnlUsd = round2(GROSS_PNL_USD - totalFeeUsd - totalSlippageUsd);

  return {
    netReturnUsd: netPnlUsd,
    netReturnPercent: round2((netPnlUsd / CAPITAL_USD) * 100),
    maxDrawdownUsd: -3.21,
    maxDrawdownPercent: -3.03,
    winRatePercent: round2((WINNING_TRADES / TOTAL_TRADES) * 100),
    winningTrades: WINNING_TRADES,
    totalTrades: TOTAL_TRADES,
    avgNetPerTradeUsd: round2(netPnlUsd / TOTAL_TRADES),
    avgCostPerTradeUsd: round2((totalFeeUsd + totalSlippageUsd) / TOTAL_TRADES),
    buyAndHoldPercent: 1.29,
    vsBuyAndHoldPts: round2(netPnlUsd - 1.29),
    grossPnlUsd: GROSS_PNL_USD,
    totalFeeUsd,
    totalSlippageUsd,
    netPnlUsd,
    costShareOfGrossPercent: round2(((totalFeeUsd + totalSlippageUsd) / GROSS_PNL_USD) * 100),
    supportLevel: 67800,
    resistanceLevel: 70200,
    assumptions: [
      `Fees ${feePercent}% and slippage ${slippageBps} bps apply to every trade.`,
      'Signals use closed candles only.',
      'Prices are Binance spot USDT pairs.',
    ],
    equityCurve: buildEquityCurve(),
    priceSeries: buildPriceSeries(),
    trades: buildTrades(totalFeeUsd, totalSlippageUsd),
  };
}

export function seedBacktestRuns(): BacktestRun[] {
  return [
    {
      id: 'R-1042',
      status: 'completed',
      progressPercent: 100,
      strategyId: null,
      strategyName: 'MA Crossover',
      strategyVersion: 'built-in',
      strategyKind: 'builtin',
      rules: MA_CROSSOVER_RULES,
      pair: 'BTCUSDT',
      timeframe: '5m',
      from: '2025-05-01',
      to: '2025-05-15',
      capitalUsd: 100,
      feePercent: 0.08,
      slippageBps: 5,
      startedAt: '2025-05-20T10:42:00.000Z',
      endedAt: '2025-05-20T10:42:12.000Z',
      resultLabel: '+8.42% · max DD −3.03%',
      failureReason: null,
    },
    {
      id: 'R-1041',
      status: 'failed',
      progressPercent: 100,
      strategyId: 'st-rsi-bb',
      strategyName: 'RSI_BB_LB_LONG_SL2_TP4',
      strategyVersion: '1.0.0',
      strategyKind: 'strategy',
      rules: [
        'LONG when RSI(14) is below 30 and the close is under the lower Bollinger Band (20, 2)',
        'Stop loss 2% below entry',
        'Take profit 4% above entry',
      ],
      pair: 'SOLUSDT',
      timeframe: '1h',
      from: '2019-06-01',
      to: '2020-12-31',
      capitalUsd: 100,
      feePercent: 0.08,
      slippageBps: 5,
      startedAt: '2025-05-19T16:30:00.000Z',
      endedAt: '2025-05-19T16:30:12.000Z',
      resultLabel: 'Failed · no candles for that period',
      failureReason:
        'Binance has no SOLUSDT candles before 11 Aug 2020, when the pair was listed. Pick a start date on or after that day.',
    },
    {
      id: 'R-1040',
      status: 'cancelled',
      progressPercent: 100,
      strategyId: 'st-macd',
      strategyName: 'MACD_Cross_TrendFollow',
      strategyVersion: '1.2.1',
      strategyKind: 'strategy',
      rules: [
        'LONG when the MACD line crosses above its signal line and the close is above EMA(200)',
        'Exit when the MACD line crosses back below its signal line',
      ],
      pair: 'ETHUSDT',
      timeframe: '15m',
      from: '2025-03-01',
      to: '2025-04-30',
      capitalUsd: 100,
      feePercent: 0.08,
      slippageBps: 5,
      startedAt: '2025-05-18T09:05:00.000Z',
      endedAt: '2025-05-18T09:05:05.000Z',
      resultLabel: 'Cancelled',
      failureReason: null,
    },
  ];
}
