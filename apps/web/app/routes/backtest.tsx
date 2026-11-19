import { ScreenPlaceholder } from '~/layouts/workspace/ScreenPlaceholder';
import type { Route } from './+types/backtest';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Backtest – Crypto Force' }];
}

export default function BacktestRoute() {
  return <ScreenPlaceholder title="Backtest" />;
}
