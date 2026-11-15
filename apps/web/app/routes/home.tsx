import type { Route } from './+types/home';

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'Crypto Force' },
    { name: 'description', content: 'Build, backtest and discover crypto trading strategies.' },
  ];
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-4 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">Crypto Force</h1>
    </main>
  );
}
