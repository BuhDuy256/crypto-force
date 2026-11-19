import { ScreenPlaceholder } from '~/layouts/workspace/ScreenPlaceholder';
import type { Route } from './+types/discovery';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Discovery – Crypto Force' }];
}

export default function DiscoveryRoute() {
  return <ScreenPlaceholder title="Discovery" />;
}
