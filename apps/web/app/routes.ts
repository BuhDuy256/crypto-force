import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  layout('routes/auth-layout.tsx', [
    route('sign-in', 'routes/sign-in.tsx'),
    route('sign-up', 'routes/sign-up.tsx'),
    route('sign-up/verify', 'routes/verify-email.tsx'),
    route('forgot-password', 'routes/forgot-password.tsx'),
    route('reset-password', 'routes/reset-password.tsx'),
  ]),
  layout('routes/workspace-layout.tsx', [
    route('realtime', 'routes/realtime.tsx'),
    route('strategy', 'routes/strategy.tsx'),
    route('discovery', 'routes/discovery.tsx'),
    route('backtest', 'routes/backtest.tsx'),
    route('news', 'routes/news.tsx'),
  ]),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
