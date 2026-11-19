import { ScreenPlaceholder } from '~/layouts/workspace/ScreenPlaceholder';
import type { Route } from './+types/strategy';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Strategy Engine – Crypto Force' }];
}

export default function StrategyRoute() {
  return <ScreenPlaceholder title="Strategy Engine" />;
}
