import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';
import type { Route } from './+types/root';
import './app.css';
import onestLatinUrl from './assets/fonts/onest-latin.woff2?url';

export const links: Route.LinksFunction = () => [
  { rel: 'preload', href: onestLatinUrl, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    // Dark is the default theme; how users switch theme is OQ-076.
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#main"
          className="absolute top-[-60px] left-3 z-50 rounded-lg bg-primary px-3.5 py-2.5 font-semibold text-primary-foreground no-underline focus:top-3"
        >
          Skip to main content
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function HydrateFallback() {
  return null;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const title = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : 'Error';
  const detail = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {detail && <pre className="mt-4 overflow-x-auto text-sm">{detail}</pre>}
    </main>
  );
}
