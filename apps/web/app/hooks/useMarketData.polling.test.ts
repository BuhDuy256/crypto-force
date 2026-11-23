// @vitest-environment happy-dom
// Checks the public Market Data hooks with React, a real QueryClient and a memory router.
// Only fetch is replaced. Fake timers control deadlines. No DB is used.
// Run: pnpm --filter @crypto-force/web exec vitest run app/hooks/useMarketData.polling.test.ts.
// Expected: docs/testing/test-scopes/TS-002-market-data/websocket-verification.md (ADR-009 replaces
// 5s HTTP polling with WebSocket while preserving monotonic dataTime guards on candles and summary).
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCandleHistory, useMarketSummary } from './useMarketData';

let root: Root;
let client: QueryClient;
let router: ReturnType<typeof createMemoryRouter>;
let history: ReturnType<typeof useCandleHistory>;
let summary: ReturnType<typeof useMarketSummary>;
let host: HTMLDivElement;
const fetchBoundary = vi.fn<typeof fetch>();

function snapshot(dataTime: number, close = 100) {
  return {
    pair: 'BTCUSDT',
    timeframe: '5m',
    warmupCount: 0,
    dataTime,
    candles: [
      {
        openTime: 1735689600000,
        open: 100,
        high: 110,
        low: 90,
        close,
        volume: 10,
        isClosed: false,
      },
    ],
  };
}

function summaryPayload(dataTime: number, lastPrice = 100) {
  return {
    pair: 'BTCUSDT',
    lastPrice,
    change24hPercent: -1,
    dataTime,
  };
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(1800000000000);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', fetchBoundary);
  fetchBoundary.mockReset();
  fetchBoundary.mockImplementation((input) =>
    Promise.resolve(
      Response.json(
        (input instanceof Request ? input.url : String(input)).includes('/summary')
          ? summaryPayload(1800000000000)
          : snapshot(1800000000000),
      ),
    ),
  );
  client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  function Probe() {
    history = useCandleHistory('BTCUSDT', '5m');
    summary = useMarketSummary('BTCUSDT');
    return createElement(
      'output',
      null,
      JSON.stringify({ data: history.data, error: history.isError, summary: summary.data }),
    );
  }
  router = createMemoryRouter([{ path: '/', element: createElement(Probe) }]);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root.render(
      createElement(QueryClientProvider, { client }, createElement(RouterProvider, { router })),
    );
  });
  await flush();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  router.dispose();
  client.clear();
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it.each([4999, 5000, 5001])(
  'does not issue periodic HTTP polling requests at elapsed %i ms after initial load',
  async (elapsed) => {
    expect(history.data?.candles[0]?.close).toBe(100);
    expect(summary.data?.lastPrice).toBe(100);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(elapsed);
    });
    const calls = fetchBoundary.mock.calls.map(([input]) =>
      input instanceof Request ? input.url : String(input),
    );
    expect(calls.filter((url) => url.includes('/candles'))).toHaveLength(1);
    expect(calls.filter((url) => url.includes('/summary'))).toHaveLength(1);
  },
);

it('keeps the newer candle snapshot after an older response', async () => {
  fetchBoundary.mockResolvedValueOnce(Response.json(snapshot(1799999999999, 99)));
  await act(async () => {
    await history.refetch();
  });
  await flush();
  expect(history.data?.dataTime).toBe(1800000000000);
  expect(history.data?.candles[0]?.close).toBe(100);
});

it('keeps the newer market summary after an older response', async () => {
  fetchBoundary.mockResolvedValueOnce(Response.json(summaryPayload(1799999999999, 95)));
  await act(async () => {
    await summary.refetch();
  });
  await flush();
  expect(summary.data?.dataTime).toBe(1800000000000);
  expect(summary.data?.lastPrice).toBe(100);
});

it('accepts a newer snapshot and its candle value', async () => {
  fetchBoundary.mockResolvedValueOnce(Response.json(snapshot(1800000000001, 101)));
  await act(async () => {
    await history.refetch();
  });
  await flush();
  expect(history.data?.dataTime).toBe(1800000000001);
  expect(history.data?.candles[0]?.close).toBe(101);
});

it('keeps data on a backfill error and recovers on subsequent refetch', async () => {
  fetchBoundary.mockResolvedValueOnce(
    Response.json({ error: { code: 'MARKET_DATA_UNAVAILABLE' } }, { status: 503 }),
  );
  await act(async () => {
    await history.refetch();
  });
  await flush();
  expect(history.isError).toBe(true);
  expect(history.data?.dataTime).toBe(1800000000000);
  await act(async () => {
    await history.refetch();
  });
  await flush();
  expect(history.isError).toBe(false);
  expect(history.data?.candles[0]?.close).toBe(100);
});

it('does not overlap a slow chart refresh', async () => {
  let release: (response: Response) => void = () => {
    throw new Error('The response resolver is missing.');
  };
  const pending = new Promise<Response>((resolve) => {
    release = resolve;
  });
  fetchBoundary.mockReturnValueOnce(pending);
  const refresh1 = history.refetch({ cancelRefetch: false });
  const refresh2 = history.refetch({ cancelRefetch: false });
  expect(
    fetchBoundary.mock.calls.filter(([input]) =>
      (input instanceof Request ? input.url : String(input)).includes('/candles'),
    ),
  ).toHaveLength(2);
  await act(async () => {
    release(Response.json(snapshot(1800000000001, 101)));
    await Promise.all([refresh1, refresh2]);
  });
  await flush();
  expect(history.data?.candles[0]?.close).toBe(101);
});

it('accepts an equal dataTime without discarding valid data', async () => {
  fetchBoundary.mockResolvedValueOnce(Response.json(snapshot(1800000000000, 102)));
  await act(async () => {
    await history.refetch();
  });
  await flush();
  expect(history.data?.dataTime).toBe(1800000000000);
  expect(history.data?.candles[0]?.close).toBe(102);
});
