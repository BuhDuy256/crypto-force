import { StrategyLibraryPage } from '~/pages/StrategyLibrary/StrategyLibraryPage';
import type { Route } from './+types/library';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Strategy library – Crypto Force' }];
}

export default function LibraryRoute() {
  return <StrategyLibraryPage />;
}
