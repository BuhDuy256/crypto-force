import { BacktestPage } from '~/pages/Backtest/BacktestPage';
import type { Route } from './+types/backtest';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Backtest – Crypto Force' }];
}

export default function BacktestRoute() {
  return <BacktestPage />;
}
