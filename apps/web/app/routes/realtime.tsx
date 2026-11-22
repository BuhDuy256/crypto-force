import { RealtimePage } from '~/pages/Realtime/RealtimePage';
import type { Route } from './+types/realtime';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Realtime – Crypto Force' }];
}

export default function RealtimeRoute() {
  return <RealtimePage />;
}
