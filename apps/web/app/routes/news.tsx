import { ScreenPlaceholder } from '~/layouts/workspace/ScreenPlaceholder';
import type { Route } from './+types/news';

export function meta(): Route.MetaDescriptors {
  return [{ title: 'News – Crypto Force' }];
}

export default function NewsRoute() {
  return <ScreenPlaceholder title="News" />;
}
