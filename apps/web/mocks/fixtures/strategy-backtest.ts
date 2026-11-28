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

const CAPITAL_CENTS = 10000;
const GROSS_PNL_CENTS = 2266;
const BASE_FEE_CENTS = 890;
const BASE_SLIPPAGE_CENTS = 534;
const BASE_FEE_PERCENT = 0.08;
const BASE_SLIPPAGE_BPS = 5;
const TOTAL_TRADES = 178;
const BUY_AND_HOLD_PERCENT = 1.29;

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
    ],
    definitionJson: JSON.stringify(definition, null, 2),
    checks: [
      { title: 'Required fields', detail: 'None missing', passed: true },
      { title: 'Logic', detail: 'Consistent', passed: true },
      { title: 'Indicators', detail: 'All supported', passed: true },
    ],
    suggestedName: 'RSI_BB_LB_LONG_SL2_TP4',
    suggestedTags: ['RSI', 'Bollinger', 'Mean Reversion', 'Long'],
  };
}

const HOUR_SEC = 3600;
const TRADE_SPACING_SEC = 6600;
const FIRST_TRADE_SEC = 1746080100;
const PRICE_START_SEC = 1746079200;
const PRICE_CANDLE_SEC = 900;
const PRICE_CANDLE_COUNT = 96;
const STOP_LOSS_FRACTION = 0.0075;
const TAKE_PROFIT_FRACTION = 0.015;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EQUITY_WAYPOINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 100],
  [0.12, 101.6],
  [0.25, 103.1],
  [0.33, 102.4],
  [0.42, 105.9],
  [0.53, 102.69],
  [0.64, 104.3],
  [0.78, 106.4],
  [0.9, 107.2],
  [1, 108.42],
];

const PRICE_WAYPOINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 68100],
  [0.04, 67850],
  [0.12, 68350],
  [0.26, 69250],
  [0.38, 69800],
  [0.45, 68950],
  [0.54, 68450],
  [0.64, 69050],
  [0.74, 69500],
  [0.84, 69150],
  [0.94, 68950],
  [1, 68980],
];

function interpolate(points: ReadonlyArray<readonly [number, number]>, position: number): number {
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    if (!start || !end) continue;
    if (position <= end[0]) {
      return start[1] + ((end[1] - start[1]) * (position - start[0])) / (end[0] - start[0]);
    }
  }
  const last = points[points.length - 1];
  return last ? last[1] : 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function spreadCents(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatOpenedAt(timeSec: number): string {
  const date = new Date(timeSec * 1000);
  const month = MONTHS[date.getUTCMonth()] ?? '';
  return `${pad2(date.getUTCDate())} ${month}, ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}

function formatHeld(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${String(Math.floor(minutes / 60))}h ${pad2(minutes % 60)}m`;
}

/** Account value in cents after each trade. Index 0 is the starting capital. */
function equityPathCents(): number[] {
  const random = seededRandom(4242);
  return Array.from({ length: TOTAL_TRADES + 1 }, (_, index) => {
    const target = Math.round(interpolate(EQUITY_WAYPOINTS, index / TOTAL_TRADES) * 100);
    if (index === 0 || index === TOTAL_TRADES) return target;
    return target + Math.round((random() - 0.5) * 40);
  });
}

/** Deterministic market price at a point in time, shared by the candles and the trade prices. */
function priceAt(timeSec: number): number {
  const position = (timeSec - PRICE_START_SEC) / (PRICE_CANDLE_SEC * PRICE_CANDLE_COUNT);
  const wrapped = position - Math.floor(position);
  return interpolate(PRICE_WAYPOINTS, wrapped) + Math.sin(timeSec / 2400) * 90;
}

interface TradeRows {
  trades: BacktestTrade[];
  equityCurve: BacktestEquityPoint[];
}

function buildTradeRows(feeCents: number[], slippageCents: number[]): TradeRows {
  const baseFee = spreadCents(BASE_FEE_CENTS, TOTAL_TRADES);
  const baseSlippage = spreadCents(BASE_SLIPPAGE_CENTS, TOTAL_TRADES);
  const path = equityPathCents();
  const trades: BacktestTrade[] = [];
  const equityCurve: BacktestEquityPoint[] = [];
  let accountCents = CAPITAL_CENTS;
  let peakCents = CAPITAL_CENTS;

  equityCurve.push({
    timeSec: FIRST_TRADE_SEC - TRADE_SPACING_SEC,
    accountValueUsd: CAPITAL_CENTS / 100,
    buyAndHoldUsd: CAPITAL_CENTS / 100,
    drawdownUsd: 0,
  });

  for (let offset = 0; offset < TOTAL_TRADES; offset += 1) {
    const index = offset + 1;
    const grossCents =
      (path[index] ?? 0) -
      (path[offset] ?? 0) +
      (baseFee[offset] ?? 0) +
      (baseSlippage[offset] ?? 0);
    const fee = feeCents[offset] ?? 0;
    const slippage = slippageCents[offset] ?? 0;
    const netCents = grossCents - fee - slippage;
    const side = index % 2 === 1 ? 'LONG' : 'SHORT';
    const direction = side === 'LONG' ? 1 : -1;
    const openedTimeSec = FIRST_TRADE_SEC + offset * TRADE_SPACING_SEC;
    const heldSec = HOUR_SEC + ((index * 7) % 10) * 300;
    const entryPrice = round2(priceAt(openedTimeSec));
    const exitPrice = round2(entryPrice * (1 + (direction * grossCents) / CAPITAL_CENTS));

    trades.push({
      index,
      openedAt: formatOpenedAt(openedTimeSec),
      openedTimeSec,
      closedTimeSec: openedTimeSec + heldSec,
      side,
      pnlUsd: netCents / 100,
      pnlPercent: round2((netCents / CAPITAL_CENTS) * 100),
      entryPrice,
      exitPrice,
      stopLoss: round2(entryPrice * (1 - direction * STOP_LOSS_FRACTION)),
      takeProfit: round2(entryPrice * (1 + direction * TAKE_PROFIT_FRACTION)),
      feeUsd: fee / 100,
      slippageUsd: slippage / 100,
      heldDuration: formatHeld(heldSec),
    });

    accountCents += netCents;
    peakCents = Math.max(peakCents, accountCents);
    const progress = index / TOTAL_TRADES;
    equityCurve.push({
      timeSec: openedTimeSec + heldSec,
      accountValueUsd: accountCents / 100,
      buyAndHoldUsd: round2(
        100 + BUY_AND_HOLD_PERCENT * progress + Math.sin(progress * Math.PI * 4) * 0.6,
      ),
      drawdownUsd: (accountCents - peakCents) / 100,
    });
  }

  return { trades, equityCurve };
}

function buildPriceSeries(): BacktestPriceCandle[] {
  const random = seededRandom(7919);
  const closes: number[] = [];
  const candles = Array.from({ length: PRICE_CANDLE_COUNT }, (_, index) => {
    const openTime = PRICE_START_SEC + index * PRICE_CANDLE_SEC;
    const open = index === 0 ? round2(priceAt(openTime)) : (closes[index - 1] ?? 0);
    const close = round2(priceAt(openTime + PRICE_CANDLE_SEC - 1) + (random() - 0.5) * 60);
    closes.push(close);
    return {
      timeSec: openTime,
      open,
      high: round2(Math.max(open, close) + random() * 70),
      low: round2(Math.min(open, close) - random() * 70),
      close,
      volume: round2(0.15 + random() * 0.5 + (random() > 0.88 ? 0.35 : 0)),
    };
  });
  const mean = (values: number[]): number =>
    round2(values.reduce((sum, value) => sum + value, 0) / values.length);

  return candles.map((candle, index) => ({
    ...candle,
    ma20: index < 19 ? null : mean(closes.slice(index - 19, index + 1)),
    ma50: index < 49 ? null : mean(closes.slice(index - 49, index + 1)),
  }));
}

function maxDrawdownPercent(curve: BacktestEquityPoint[]): number {
  let peak = curve[0]?.accountValueUsd ?? CAPITAL_CENTS / 100;
  let worst = 0;
  for (const point of curve) {
    peak = Math.max(peak, point.accountValueUsd);
    worst = Math.min(worst, ((point.accountValueUsd - peak) / peak) * 100);
  }
  return round2(worst);
}

function signedPercent(value: number): string {
  const body = `${Math.abs(value).toFixed(2)}%`;
  if (value > 0) return `+${body}`;
  return value < 0 ? `−${body}` : body;
}

export function formatResultLabel(result: BacktestResultSummary): string {
  return `${signedPercent(result.netReturnPercent)} · max DD ${signedPercent(result.maxDrawdownPercent)}`;
}

export function createMockRunResult(
  feePercent: number,
  slippageBps: number,
): BacktestResultSummary {
  const totalFeeCents = Math.round((BASE_FEE_CENTS * feePercent) / BASE_FEE_PERCENT);
  const totalSlippageCents = Math.round((BASE_SLIPPAGE_CENTS * slippageBps) / BASE_SLIPPAGE_BPS);
  const { trades, equityCurve } = buildTradeRows(
    spreadCents(totalFeeCents, TOTAL_TRADES),
    spreadCents(totalSlippageCents, TOTAL_TRADES),
  );
  const netCents = GROSS_PNL_CENTS - totalFeeCents - totalSlippageCents;
  const winningTrades = trades.filter((trade) => trade.pnlUsd > 0).length;
  const netReturnPercent = round2((netCents / CAPITAL_CENTS) * 100);
  const maxDrawdownUsd = Math.min(...equityCurve.map((point) => point.drawdownUsd));

  return {
    netReturnUsd: netCents / 100,
    netReturnPercent,
    maxDrawdownUsd,
    maxDrawdownPercent: maxDrawdownPercent(equityCurve),
    winRatePercent: round2((winningTrades / TOTAL_TRADES) * 100),
    winningTrades,
    totalTrades: TOTAL_TRADES,
    avgNetPerTradeUsd: Math.round((netCents / TOTAL_TRADES) * 10) / 1000,
    avgCostPerTradeUsd:
      Math.round(((totalFeeCents + totalSlippageCents) / TOTAL_TRADES) * 10) / 1000,
    buyAndHoldPercent: BUY_AND_HOLD_PERCENT,
    vsBuyAndHoldPts: round2(netReturnPercent - BUY_AND_HOLD_PERCENT),
    grossPnlUsd: GROSS_PNL_CENTS / 100,
    totalFeeUsd: totalFeeCents / 100,
    totalSlippageUsd: totalSlippageCents / 100,
    netPnlUsd: netCents / 100,
    costShareOfGrossPercent: round2(((totalFeeCents + totalSlippageCents) / GROSS_PNL_CENTS) * 100),
    supportLevel: 67800,
    resistanceLevel: 70200,
    assumptions: [
      'Both LONG and SHORT positions',
      'Stop loss and take profit filled on real OHLC prices',
      'Position size: full capital per trade',
      'Same inputs always give the same result',
    ],
    equityCurve,
    priceSeries: buildPriceSeries(),
    trades,
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
      resultLabel: formatResultLabel(createMockRunResult(0.08, 5)),
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
