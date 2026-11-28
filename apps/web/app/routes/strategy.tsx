import { StrategyEnginePage } from '~/pages/StrategyEngine/StrategyEnginePage';
import type { Route } from './+types/strategy';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Strategy Engine – Crypto Force' }];
}

export default function StrategyRoute() {
  return <StrategyEnginePage />;
}
