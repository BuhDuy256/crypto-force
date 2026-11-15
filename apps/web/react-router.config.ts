import type { Config } from '@react-router/dev/config';

export default {
  // SPA for the application; landing routes are prerendered for SEO.
  ssr: false,
  prerender: ['/'],
} satisfies Config;
