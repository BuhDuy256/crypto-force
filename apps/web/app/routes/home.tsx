import { LandingPage } from '~/pages/Landing/LandingPage';
import type { Route } from './+types/home';

const title = 'Crypto Force – Test the idea before you trade it';

export function meta(): Route.MetaDescriptors {
  return [
    { title },
    {
      name: 'description',
      content:
        'Describe a trading idea, review the strategy rules, and compare simulated return with maximum drawdown. Research only; no real orders.',
    },
    { property: 'og:title', content: title },
    {
      property: 'og:description',
      content:
        'Explore trading ideas, review rule sets, and compare simulated results without placing orders.',
    },
    { property: 'og:type', content: 'website' },
    { name: 'theme-color', content: '#0B0E12' },
  ];
}

export default function Home() {
  return <LandingPage />;
}
