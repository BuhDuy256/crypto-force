import type { RequestHandler } from 'msw';
import { backtestHandlers } from './backtest.handlers';
import { marketDataHandlers } from './market-data.handlers';
import { strategyHandlers } from './strategy.handlers';

export const handlers: RequestHandler[] = [
  ...marketDataHandlers,
  ...strategyHandlers,
  ...backtestHandlers,
];
