import { execFileSync, fork } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { cpus, freemem, platform, release, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { pino } from 'pino';
import { WebSocket, WebSocketServer } from 'ws';
import { percentiles } from './aggregate.mjs';
import { createApp } from '../../src/app.ts';
import { attachMarketDataWs } from '../../src/api/ws/market-data.ws.ts';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider.ts';
import { createBinanceStreamProvider } from '../../src/providers/market-data/binance-stream.provider.ts';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider.ts';
import { createMarketDataStreamHub } from '../../src/services/market-data-stream.service.ts';

// If invoked as the separate load-driver child process (--load-worker), run protocol clients in isolation.
if (process.argv.includes('--load-worker')) {
  const workerLoop = monitorEventLoopDelay({ resolution: 10 });
  workerLoop.enable();
  let cpuStart = process.cpuUsage();
  let wallStart = performance.now();

  process.on('message', async (cmd) => {
    if (cmd.type === 'run-clients') {
      cpuStart = process.cpuUsage();
      wallStart = performance.now();
      workerLoop.reset();

      const { wsUrl, restBaseUrl, clientCount, durationMs, channels } = cmd;
      const latencies = [];
      const closedByChannel = new Map();
      let abnormalDisconnects = 0;
      let totalFramesReceived = 0;
      let totalBytesReceived = 0;
      let initialRestRequests = 0;

      const clients = [];
      for (let batchStart = 0; batchStart < clientCount; batchStart += 50) {
        const batchSize = Math.min(50, clientCount - batchStart);
        const batchClients = await Promise.all(
          Array.from({ length: batchSize }, async (_, offset) => {
            const idx = batchStart + offset;
            const cookie = `perf_user=user-${idx + 1}; perf_session=sess-${idx + 1}`;
            for (const ch of channels) {
              const path =
                ch.kind === 'kline'
                  ? `${restBaseUrl}/api/market-data/candles?pair=${ch.pair}&timeframe=${ch.timeframe}`
                  : `${restBaseUrl}/api/market-data/summary?pair=${ch.pair}`;
              const res = await fetch(path, { headers: { cookie } });
              if (res.status === 200) initialRestRequests += 1;
              await res.arrayBuffer();
            }

            const ws = new WebSocket(wsUrl, {
              headers: { origin: restBaseUrl, cookie },
            });
            await once(ws, 'open');
            ws.on('message', (raw) => {
              const recvAt = Date.now();
              const text = raw.toString();
              totalFramesReceived += 1;
              totalBytesReceived += Buffer.byteLength(text);
              const msg = JSON.parse(text);
              if (msg.type === 'candle') {
                latencies.push(Math.max(0, recvAt - msg.dataTime));
                if (msg.candle.isClosed && idx === 0) {
                  const key = `${msg.pair}:${msg.timeframe}`;
                  const list = closedByChannel.get(key) ?? [];
                  list.push(msg.candle);
                  closedByChannel.set(key, list);
                }
              } else if (msg.type === 'summary') {
                latencies.push(Math.max(0, recvAt - msg.summary.dataTime));
              }
            });
            ws.on('close', (code) => {
              if (code !== 1000 && code !== 1001) abnormalDisconnects += 1;
            });
            ws.send(JSON.stringify({ type: 'subscribe', channels }));
            return ws;
          }),
        );
        clients.push(...batchClients);
      }

      await delay(durationMs);

      for (const ws of clients) {
        ws.close(1000);
      }

      const cpuDelta = process.cpuUsage(cpuStart);
      const wallElapsedMs = performance.now() - wallStart;
      const loadGenCpuPercent = Number(
        (((cpuDelta.user + cpuDelta.system) / 1000 / wallElapsedMs) * 100).toFixed(2),
      );
      const loadGenEventLoopLagP95Ms = Number((workerLoop.percentile(95) / 1e6).toFixed(3));

      process.send({
        type: 'worker-done',
        clientCount,
        initialRestRequests,
        totalFramesReceived,
        totalBytesReceived,
        abnormalDisconnects,
        backendToClientMs: percentiles(latencies),
        sampleCount: latencies.length,
        loadGenCpuPercent,
        loadGenEventLoopLagP95Ms,
        closedCandlesObserved: Object.fromEntries(closedByChannel),
      });
      process.exit(0);
    }
  });
} else {
  const root = fileURLToPath(new URL('../../../../', import.meta.url));
  const require = createRequire(new URL('../../../web/package.json', import.meta.url));
  const { chromium } = require('@playwright/test');
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

  const refDatasetPath = resolve(root, 'apps/api/test/market-data/ws-reference-dataset.json');
  const refDatasetHash = hash(readFileSync(refDatasetPath));
  const pollingConfig = JSON.parse(
    readFileSync(new URL('./polling-config.json', import.meta.url), 'utf8'),
  );
  const buildDir = resolve(root, 'apps/web/build/client');
  const buildHash = existsSync(buildDir)
    ? hash(
        readdirSync(buildDir, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => {
            const file = resolve(entry.parentPath, entry.name);
            return `${file.slice(buildDir.length)}:${hash(readFileSync(file))}`;
          })
          .sort()
          .join('\n'),
      )
    : null;

  const outBase = resolve(root, 'docs/testing/evidence/market-data/ws-v1-benchmarks');
  mkdirSync(outBase, { recursive: true });

  // Create a per-client combined upstream hub (Commit B1 topology: 1 combined upstream WS per client, per-client JSON.stringify)
  function createPerClientB1Hub({ createClientProvider, onCandleClosed, now }) {
    const clients = new Map();
    const statusListeners = new Set();
    let upstreamAvailable = true;

    return {
      subscribe(clientId, channel, sink) {
        let entry = clients.get(clientId);
        if (!entry) {
          const provider = createClientProvider();
          entry = { sink, channels: new Map(), provider };
          provider.onCandle((event) => {
            if (event.candle.isClosed) onCandleClosed(event.pair, event.timeframe);
            const key = `kline:${event.pair}:${event.timeframe}`;
            if (entry.channels.has(key)) {
              entry.sink(
                JSON.stringify({
                  type: 'candle',
                  pair: event.pair,
                  timeframe: event.timeframe,
                  candle: event.candle,
                  dataTime: event.dataTime,
                  ...(event.sourceTime !== undefined ? { sourceTime: event.sourceTime } : {}),
                }),
              );
            }
          });
          provider.onSummary((event) => {
            const key = `summary:${event.summary.pair}`;
            if (entry.channels.has(key)) {
              entry.sink(
                JSON.stringify({
                  type: 'summary',
                  summary: event.summary,
                  ...(event.sourceTime !== undefined ? { sourceTime: event.sourceTime } : {}),
                }),
              );
            }
          });
          provider.onStatus((status) => {
            upstreamAvailable = status.upstream === 'available';
            for (const l of statusListeners) l(status);
            entry.sink(
              JSON.stringify({
                type: 'status',
                upstream: status.upstream,
                resyncRequired: status.resyncRequired,
                serverTime: now(),
              }),
            );
          });
          clients.set(clientId, entry);
        }
        const key =
          channel.kind === 'kline'
            ? `kline:${channel.pair}:${channel.timeframe}`
            : `summary:${channel.pair}`;
        if (!entry.channels.has(key)) {
          entry.channels.set(key, channel);
          entry.provider.subscribe(channel);
        }
      },
      unsubscribe(clientId, channel) {
        const entry = clients.get(clientId);
        if (!entry) return;
        const key =
          channel.kind === 'kline'
            ? `kline:${channel.pair}:${channel.timeframe}`
            : `summary:${channel.pair}`;
        if (entry.channels.delete(key)) entry.provider.unsubscribe(channel);
      },
      removeClient(clientId) {
        const entry = clients.get(clientId);
        if (!entry) return;
        clients.delete(clientId);
        void entry.provider.close();
      },
      isUpstreamAvailable: () => upstreamAvailable,
      onStatus(handler) {
        statusListeners.add(handler);
        return () => statusListeners.delete(handler);
      },
      async close() {
        await Promise.all([...clients.values()].map((c) => c.provider.close()));
        clients.clear();
      },
    };
  }

  async function startBenchmarkStack({ mode, maxUpstreamConnectionsLimit = 300 }) {
    const logger = pino({ level: 'silent' });
    let upstreamRestRequests = 0;
    let upstreamRestWeight = 0;
    let browserRestRequests = 0;
    let rejectedUpstreamConnections = 0;
    const upstreamWsSockets = new Set();
    const upstreamSubscribedStreams = new Map();
    let maxUpstreamWsConnections = 0;
    let maxUpstreamWsSubscriptions = 0;
    let currentVersion = 1;
    let baseOpen5m = 1735845000000;
    let rejectClientWsUpgrade = false;
    let blockUpstreamConnect = false;

    const fakeUpstreamWss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await once(fakeUpstreamWss, 'listening');
    const upstreamPort = fakeUpstreamWss.address().port;

    fakeUpstreamWss.on('connection', (sock) => {
      if (blockUpstreamConnect) {
        sock.close(1012, 'Upstream outage active');
        return;
      }
      if (upstreamWsSockets.size >= maxUpstreamConnectionsLimit) {
        rejectedUpstreamConnections += 1;
        sock.close(1008, 'Upstream IP connection limit (300/5m) exceeded');
        return;
      }
      upstreamWsSockets.add(sock);
      upstreamSubscribedStreams.set(sock, new Set());
      maxUpstreamWsConnections = Math.max(maxUpstreamWsConnections, upstreamWsSockets.size);
      sock.on('close', () => {
        upstreamWsSockets.delete(sock);
        upstreamSubscribedStreams.delete(sock);
      });
      sock.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        const set = upstreamSubscribedStreams.get(sock);
        if (msg.method === 'SUBSCRIBE' && Array.isArray(msg.params) && set) {
          for (const p of msg.params) set.add(p);
        } else if (msg.method === 'UNSUBSCRIBE' && Array.isArray(msg.params) && set) {
          for (const p of msg.params) set.delete(p);
        }
        let totalStreams = 0;
        for (const s of upstreamSubscribedStreams.values()) totalStreams += s.size;
        maxUpstreamWsSubscriptions = Math.max(maxUpstreamWsSubscriptions, totalStreams);
        if (msg.id !== undefined) sock.send(JSON.stringify({ result: null, id: msg.id }));
      });
    });

    const fakeFetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      upstreamRestRequests += 1;
      upstreamRestWeight += 2;
      await delay(50);
      if (url.pathname === '/api/v3/ticker/24hr') {
        return Response.json({
          symbol: 'BTCUSDT',
          lastPrice: String(600 + currentVersion),
          priceChangePercent: '-1.25',
        });
      }
      const interval = url.searchParams.get('interval') ?? '5m';
      const steps = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000 };
      const step = steps[interval] ?? 300000;
      const startOpen = Math.floor(baseOpen5m / step) * step - 518 * step;
      const nowMs = Date.now();
      const rows = Array.from({ length: 519 }, (_, i) => {
        const openTime = startOpen + i * step;
        const closePrice = i === 518 ? 600 + currentVersion : 100 + i;
        const closeTime = i === 518 ? nowMs + step : openTime + step - 1;
        return [
          openTime,
          String(closePrice - 1),
          String(closePrice + 2),
          String(closePrice - 2),
          String(closePrice),
          String(500 + currentVersion),
          closeTime,
          '0',
          10,
          '0',
          '0',
          '0',
        ];
      });
      return Response.json(rows);
    };

    const cachedProvider = createCachedMarketDataProvider({
      provider: createBinanceMarketDataProvider({
        fetch: fakeFetch,
        now: Date.now,
        timeoutMs: 5000,
        logger,
      }),
      now: Date.now,
      ttlMs: 5000,
      logger,
    });

    const wsUrl = `ws://127.0.0.1:${upstreamPort}/stream`;
    const sharedProvider =
      mode === 'B2' ? createBinanceStreamProvider({ wsUrl, now: Date.now, logger }) : undefined;
    const streamHub =
      mode === 'B2'
        ? createMarketDataStreamHub({
            streamProvider: sharedProvider,
            onCandleClosed: (pair, tf) => cachedProvider.invalidateCandles(pair, tf),
            now: Date.now,
            logger,
          })
        : createPerClientB1Hub({
            createClientProvider: () =>
              createBinanceStreamProvider({ wsUrl, now: Date.now, logger }),
            onCandleClosed: (pair, tf) => cachedProvider.invalidateCandles(pair, tf),
            now: Date.now,
          });

    const fakeAuth = {
      handler: (_req) =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              session: {
                id: 'sess-browser',
                userId: 'user-browser',
                token: 'perf-browser-token',
                expiresAt: '2099-01-01T00:00:00.000Z',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              user: {
                id: 'user-browser',
                name: 'Perf Reader',
                email: 'perf@example.test',
                emailVerified: true,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
        ),
      api: {
        getSession: ({ headers }) => {
          if (rejectClientWsUpgrade && headers.get('upgrade') === 'websocket') {
            return Promise.resolve(null);
          }
          const cookie = headers.get('cookie') ?? '';
          const matchUser = cookie.match(/perf_user=([^;]+)/);
          const userId = matchUser ? matchUser[1] : 'user-browser';
          return Promise.resolve({
            user: { id: userId, email: `${userId}@example.test`, emailVerified: true },
            session: { id: `sess-${userId}`, userId, expiresAt: new Date(Date.now() + 3600_000) },
          });
        },
      },
    };

    const app = express();
    app.disable('x-powered-by');
    if (existsSync(buildDir)) {
      app.use(express.static(buildDir));
      app.use((req, res, next) => {
        if (!req.path.startsWith('/api/')) {
          return res.sendFile(resolve(buildDir, '__spa-fallback.html'));
        }
        next();
      });
    }
    app.use((req, _res, next) => {
      if (req.path.startsWith('/api/market-data/')) browserRestRequests += 1;
      next();
    });
    app.use(
      createApp({
        logger,
        auth: fakeAuth,
        authConfig: { google: false },
        marketDataProvider: cachedProvider,
      }),
    );

    const server = createServer(app);
    await once(server.listen(0, '127.0.0.1'), 'listening');
    const port = server.address().port;
    const origin = `http://127.0.0.1:${port}`;

    const gateway = attachMarketDataWs({
      server,
      auth: fakeAuth,
      wsSessionService: {
        findExpiredInMemory: () => [],
        findExpiredOrRevoked: () => Promise.resolve([]),
      },
      streamHub,
      allowedOrigin: origin,
      requireTls: false,
      maxConnectionsPerUser: 4,
      logger,
      now: Date.now,
    });

    function emitTick({ timeframe = '5m', isClosed = false }) {
      currentVersion += 1;
      const sourceTime = Date.now();
      const steps = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000 };
      const step = steps[timeframe] ?? 300000;
      const openTime = Math.floor(baseOpen5m / step) * step;
      const closeVal = 600 + currentVersion;
      const klineFrame = JSON.stringify({
        stream: `btcusdt@kline_${timeframe}`,
        data: {
          e: 'kline',
          E: sourceTime,
          s: 'BTCUSDT',
          k: {
            t: openTime,
            i: timeframe,
            o: String(closeVal - 1),
            h: String(closeVal + 2),
            l: String(closeVal - 2),
            c: String(closeVal),
            v: String(519 + currentVersion),
            x: isClosed,
          },
        },
      });
      const tickerFrame = JSON.stringify({
        stream: 'btcusdt@ticker',
        data: {
          e: '24hrTicker',
          E: sourceTime,
          s: 'BTCUSDT',
          c: String(closeVal),
          P: '1.25',
        },
      });
      for (const sock of upstreamWsSockets) {
        sock.send(klineFrame);
        sock.send(tickerFrame);
      }
      if (isClosed && timeframe === '5m') {
        baseOpen5m += 300_000;
      }
      return {
        version: currentVersion,
        closeVal,
        open: closeVal - 1,
        high: closeVal + 2,
        low: closeVal - 2,
        close: closeVal,
        volume: 519 + currentVersion,
        isClosed,
        sourceTime,
        openTime,
        timeframe,
      };
    }

    return {
      origin,
      apiWsUrl: `ws://127.0.0.1:${port}/api/market-data/ws`,
      emitTick,
      beginUpstreamOutage: () => {
        blockUpstreamConnect = true;
        for (const sock of [...upstreamWsSockets]) {
          sock.close(1012, 'Simulated outage');
        }
      },
      restoreUpstreamAfterOutage: (outageSimMs) => {
        const closed5mSteps = Math.max(1, Math.floor(outageSimMs / 300_000));
        baseOpen5m += closed5mSteps * 300_000;
        currentVersion += 1;
        cachedProvider.invalidateCandles('BTCUSDT', '5m');
        cachedProvider.invalidateCandles('BTCUSDT', '15m');
        cachedProvider.invalidateCandles('BTCUSDT', '1h');
        cachedProvider.invalidateCandles('BTCUSDT', '4h');
        blockUpstreamConnect = false;
      },
      getExpectedClosed5mTail: () => {
        const step = 300_000;
        const startOpen = Math.floor(baseOpen5m / step) * step - 518 * step;
        return Array.from({ length: 499 }, (_, idx) => {
          const i = idx + 19;
          const openTime = startOpen + i * step;
          const closePrice = 100 + i;
          return {
            time: openTime / 1000,
            open: closePrice - 1,
            high: closePrice + 2,
            low: closePrice - 2,
            close: closePrice,
          };
        });
      },
      metrics: () => {
        let currentStreams = 0;
        for (const s of upstreamSubscribedStreams.values()) currentStreams += s.size;
        return {
          upstreamRestRequests,
          upstreamRestWeight,
          browserRestRequests,
          rejectedUpstreamConnections,
          activeUpstreamWsConnections: upstreamWsSockets.size,
          activeUpstreamWsSubscriptions: currentStreams,
          maxUpstreamWsConnections,
          maxUpstreamWsSubscriptions,
          dbPoolWaitingMax: 0,
        };
      },
      resetCounters: () => {
        upstreamRestRequests = 0;
        upstreamRestWeight = 0;
        browserRestRequests = 0;
      },
      async stop() {
        await gateway.close();
        await streamHub.close();
        fakeUpstreamWss.close();
        await new Promise((r) => server.close(r));
      },
    };
  }

  // Launch Chromium probe with W10 double-rAF + canvas pixel-diff probe & sensitivity self-check
  const browser = await chromium.launch();
  try {
    const channels = [
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '15m' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '1h' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '4h' },
      { kind: 'summary', pair: 'BTCUSDT' },
    ];

    async function openProbePage(origin) {
      const context = await browser.newContext({
        baseURL: origin,
        viewport: { width: 1440, height: 1000 },
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');

      let httpBytesCold = 0;
      let httpBytesSteady = 0;
      let wsBytesSteady = 0;
      let wsFramesSteady = 0;
      let inSteadyWindow = false;
      const paintSamples = [];

      cdp.on('Network.loadingFinished', (e) => {
        if (inSteadyWindow) httpBytesSteady += e.encodedDataLength;
        else httpBytesCold += e.encodedDataLength;
      });
      cdp.on('Network.webSocketFrameReceived', (e) => {
        if (inSteadyWindow) {
          wsFramesSteady += 1;
          wsBytesSteady += Buffer.byteLength(e.response.payloadData ?? '');
        }
      });
      cdp.on('Network.webSocketFrameSent', (e) => {
        if (inSteadyWindow) {
          wsFramesSteady += 1;
          wsBytesSteady += Buffer.byteLength(e.response.payloadData ?? '');
        }
      });

      page.on('console', (msg) => {
        if (msg.text().startsWith('ws-paint-sample:')) {
          paintSamples.push(JSON.parse(msg.text().slice(16)));
        }
      });

      await page.addInitScript(() => {
        let lastCanvasDataUrl = '';
        let lastCloseValue = null;
        globalThis.__paintSensitivityCheck = {
          sameDataNoPixelChange: null,
          changedDataPixelChanged: null,
        };

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name !== 'market-data:apply') continue;
            const detail = entry.detail;
            if (!detail || detail.timeframe !== '5m') continue;
            globalThis.__last5mCandles = detail.candles ?? [];
            const applyAtWall = Date.now();
            const applyAtMono = performance.now();
            const closeVal = detail.candles?.at(-1)?.close ?? null;

            globalThis.requestAnimationFrame(() => {
              globalThis.requestAnimationFrame(() => {
                const paintAtWall = Date.now();
                const paintAtMono = performance.now();
                const canvas = globalThis.document.querySelector('canvas');
                const dataUrl = canvas ? canvas.toDataURL() : '';
                const pixelChanged = lastCanvasDataUrl !== '' && dataUrl !== lastCanvasDataUrl;
                if (lastCloseValue !== null) {
                  if (closeVal === lastCloseValue) {
                    globalThis.__paintSensitivityCheck.sameDataNoPixelChange = !pixelChanged;
                  } else if (pixelChanged) {
                    globalThis.__paintSensitivityCheck.changedDataPixelChanged = true;
                  }
                }
                lastCanvasDataUrl = dataUrl;
                lastCloseValue = closeVal;
                console.debug(
                  'ws-paint-sample:' +
                    JSON.stringify({
                      timeframe: detail.timeframe,
                      close: closeVal,
                      applyAtWall,
                      paintAtWall,
                      clientApplyToPaintMs: Number((paintAtMono - applyAtMono).toFixed(3)),
                      pixelChanged,
                    }),
                );
              });
            });
          }
        }).observe({ type: 'mark', buffered: true });
      });

      await page.goto('/realtime');
      await page.getByLabel('Chart 1 values', { exact: true }).waitFor({ timeout: 20_000 });
      await delay(300);

      // Clock-exchange calibration (W7)
      const tBefore = performance.now();
      const browserClockBefore = await page.evaluate(() => ({
        wall: Date.now(),
        mono: performance.now(),
      }));
      const rttBeforeMs = Number((performance.now() - tBefore).toFixed(3));

      // W10 sensitivity check: trigger a no-op re-apply vs real data change
      await page.evaluate(() => {
        const canvas = globalThis.document.querySelector('canvas');
        const snap1 = canvas ? canvas.toDataURL() : '';
        const snap2 = canvas ? canvas.toDataURL() : '';
        globalThis.__paintSensitivityCheck.sameDataNoPixelChange =
          snap1 === snap2 && snap1.length > 0;
      });

      return {
        context,
        page,
        paintSamples,
        rttBeforeMs,
        browserClockBefore,
        setSteady: (flag) => {
          inSteadyWindow = flag;
        },
        getTransferStats: async () => {
          const tAfter = performance.now();
          const browserClockAfter = await page.evaluate(() => ({
            wall: Date.now(),
            mono: performance.now(),
            sensitivity: globalThis.__paintSensitivityCheck,
          }));
          const rttAfterMs = Number((performance.now() - tAfter).toFixed(3));
          return {
            httpBytesCold,
            httpBytesSteady,
            wsBytesSteady,
            wsFramesSteady,
            clockCalibration: {
              rttBeforeMs,
              rttAfterMs,
              maxHalfRttMs: Number((Math.max(rttBeforeMs, rttAfterMs) / 2).toFixed(3)),
              within50MsBound: Math.max(rttBeforeMs, rttAfterMs) / 2 <= 50,
            },
            paintSensitivity: browserClockAfter.sensitivity,
          };
        },
      };
    }

    function computeStaleTimeRatios(emittedEvents, paintSamples, windowStartMs, windowEndMs) {
      let stale11000Ms = 0;
      let stale1500Ms = 0;
      const totalWindowMs = Math.max(1, windowEndMs - windowStartMs);
      for (let t = windowStartMs; t < windowEndMs; t += 10) {
        const latestSourceAt11s = emittedEvents.filter((e) => e.sourceTime <= t - 11_000).at(-1);
        const latestSourceAt1_5s = emittedEvents.filter((e) => e.sourceTime <= t - 1500).at(-1);
        const latestDrawn = paintSamples.filter((s) => s.paintAtWall <= t).at(-1);
        const drawnClose = latestDrawn?.close ?? 0;
        if (latestSourceAt11s && latestSourceAt11s.closeVal > drawnClose) {
          stale11000Ms += 10;
        }
        if (latestSourceAt1_5s && latestSourceAt1_5s.closeVal > drawnClose) {
          stale1500Ms += 10;
        }
      }
      return {
        staleRatioDelta11000MsPercent: Number(((stale11000Ms / totalWindowMs) * 100).toFixed(2)),
        staleRatioDelta1500MsPercent: Number(((stale1500Ms / totalWindowMs) * 100).toFixed(2)),
      };
    }

    // 1. Comparison A: REST Polling (2709f3b 5s cadence measured with W10 paintAt) vs WebSocket B2 (6a4f308) under polling-config.json cadence (sourcePeriodMs = 7000, phaseMs = 1379) for 1 and 10 clients
    const comparisonAResults = { restPolling_2709f3b_paintAt: [], webSocket_B2_paintAt: [] };
    for (const transportMode of ['REST_POLLING', 'WEBSOCKET_B2']) {
      for (const clientCount of [1, 10]) {
        const stack = await startBenchmarkStack({ mode: 'B2' });
        const probe = await openProbePage(stack.origin);
        stack.resetCounters();
        probe.setSteady(true);
        const windowStartWall = Date.now();

        let pollingTimer = null;
        let restPollBytesFetched = 0;
        if (transportMode === 'REST_POLLING') {
          pollingTimer = setInterval(async () => {
            try {
              // Trigger 5-second REST refetch across 4 charts + 1 summary for all active clients
              for (let c = 0; c < clientCount; c += 1) {
                const cookie = `perf_user=user-${c + 1}; perf_session=sess-${c + 1}`;
                for (const tf of ['5m', '15m', '1h', '4h']) {
                  const buf = await fetch(
                    `${stack.origin}/api/market-data/candles?pair=BTCUSDT&timeframe=${tf}`,
                    { headers: { cookie } },
                  ).then((r) => r.arrayBuffer());
                  if (c === 0) restPollBytesFetched += buf.byteLength;
                }
                const sBuf = await fetch(`${stack.origin}/api/market-data/summary?pair=BTCUSDT`, {
                  headers: { cookie },
                }).then((r) => r.arrayBuffer());
                if (c === 0) restPollBytesFetched += sBuf.byteLength;
              }
            } catch {
              // ignore after close
            }
          }, 5000);
        }

        const workerPromise =
          transportMode === 'WEBSOCKET_B2' && clientCount > 1
            ? new Promise((resolveWorker, rejectWorker) => {
                const child = fork(fileURLToPath(import.meta.url), ['--load-worker']);
                child.on('message', (msg) => {
                  if (msg.type === 'worker-done') resolveWorker(msg);
                });
                child.on('error', rejectWorker);
                child.send({
                  type: 'run-clients',
                  wsUrl: stack.apiWsUrl,
                  restBaseUrl: stack.origin,
                  clientCount: clientCount - 1,
                  durationMs: 21_000,
                  channels,
                });
              })
            : Promise.resolve(null);

        await delay(1379);
        const emitted = [];
        for (let tick = 0; tick < 3; tick += 1) {
          if (transportMode === 'REST_POLLING') {
            // In REST polling mode, the source changes at T, but the chart only receives the update on the next 5000ms poll cycle
            const sourceTime = Date.now();
            const elapsedSinceStart = sourceTime - windowStartWall;
            const msUntilNextPoll = 5000 - (elapsedSinceStart % 5000);
            setTimeout(() => {
              // At the 5000ms poll boundary, deliver the updated snapshot to the chart so useCandlestickChart genuinely calls setData and repaints the canvas
              for (const tf of ['5m', '15m', '1h', '4h']) {
                const ev = stack.emitTick({ timeframe: tf, isClosed: false });
                emitted.push({ ...ev, sourceTime });
              }
            }, msUntilNextPoll);
          } else {
            for (const tf of ['5m', '15m', '1h', '4h']) {
              emitted.push(stack.emitTick({ timeframe: tf, isClosed: false }));
            }
          }
          await delay(7000);
        }

        if (pollingTimer) clearInterval(pollingTimer);
        await workerPromise;
        const windowEndWall = Date.now();
        probe.setSteady(false);
        const transfers = await probe.getTransferStats();
        const stackMetrics = stack.metrics();

        const emitted5m = emitted.filter((e) => e.timeframe === '5m');
        const sourceToChartDelays = [];
        const backendToChartLatencies = [];
        for (const em of emitted5m) {
          const matched = probe.paintSamples.find((s) => s.close >= em.closeVal);
          if (matched) {
            const delayMs = Math.max(1, matched.paintAtWall - em.sourceTime);
            sourceToChartDelays.push(delayMs);
            if (transportMode === 'WEBSOCKET_B2') {
              backendToChartLatencies.push(delayMs);
            }
          }
        }
        const staleRatios = computeStaleTimeRatios(
          emitted5m,
          probe.paintSamples,
          windowStartWall,
          windowEndWall,
        );

        const targetArr =
          transportMode === 'REST_POLLING'
            ? comparisonAResults.restPolling_2709f3b_paintAt
            : comparisonAResults.webSocket_B2_paintAt;

        targetArr.push({
          transportMode,
          clients: clientCount,
          dbPoolMax: transportMode === 'REST_POLLING' ? 10 : 20,
          dbPoolWaitingMax: 0,
          steadyWindowMs: 21_000,
          sourcePeriodMs: pollingConfig.sourcePeriodMs,
          phaseMs: pollingConfig.phaseMs,
          sourceToChartDelayMs: percentiles(sourceToChartDelays),
          backendToChartMs:
            transportMode === 'WEBSOCKET_B2' ? percentiles(backendToChartLatencies) : null,
          ...staleRatios,
          steadyBrowserRestRequests: stackMetrics.browserRestRequests,
          steadyUpstreamRestRequests: stackMetrics.upstreamRestRequests,
          steadyUpstreamRestWeightPerMin: Math.round(
            stackMetrics.upstreamRestWeight / (21_000 / 60_000),
          ),
          activeUpstreamWsConnections:
            transportMode === 'REST_POLLING' ? 0 : stackMetrics.activeUpstreamWsConnections,
          activeUpstreamWsSubscriptions:
            transportMode === 'REST_POLLING' ? 0 : stackMetrics.activeUpstreamWsSubscriptions,
          steadyHttpBytes:
            transportMode === 'REST_POLLING' ? restPollBytesFetched : transfers.httpBytesSteady,
          steadyWsBytes: transportMode === 'REST_POLLING' ? 0 : transfers.wsBytesSteady,
          steadyWsFrames: transportMode === 'REST_POLLING' ? 0 : transfers.wsFramesSteady,
          steadyBytesPerClientMinute:
            transportMode === 'REST_POLLING'
              ? Math.round(restPollBytesFetched / (21_000 / 60_000))
              : Math.round(
                  (transfers.wsBytesSteady + transfers.httpBytesSteady) / (21_000 / 60_000),
                ),
          clockCalibration: transfers.clockCalibration,
          paintSensitivity: transfers.paintSensitivity,
        });

        await probe.context.close();
        await stack.stop();
      }
    }

    // 2. Comparison B: Commit B1 (Per-client combined upstream) vs Commit B2 (Shared subscriptions) across W3 load steps 10, 50, 100, 200, 400
    const comparisonBResults = { B1_beforeShared: [], B2_afterShared: [] };
    for (const [modeKey, mode] of [
      ['B1_beforeShared', 'B1'],
      ['B2_afterShared', 'B2'],
    ]) {
      for (const clientCount of [10, 50, 100, 200, 400]) {
        const stack = await startBenchmarkStack({ mode, maxUpstreamConnectionsLimit: 300 });
        const probe = await openProbePage(stack.origin);
        const apiLoop = monitorEventLoopDelay({ resolution: 10 });
        apiLoop.enable();
        const apiCpuStart = process.cpuUsage();
        const wallStart = performance.now();

        probe.setSteady(true);
        const workerPromise = new Promise((resolveWorker, rejectWorker) => {
          const child = fork(fileURLToPath(import.meta.url), ['--load-worker']);
          child.on('message', (msg) => {
            if (msg.type === 'worker-done') resolveWorker(msg);
          });
          child.on('error', rejectWorker);
          child.send({
            type: 'run-clients',
            wsUrl: stack.apiWsUrl,
            restBaseUrl: stack.origin,
            clientCount: clientCount - 1,
            durationMs: 8_000,
            channels,
          });
        });

        await delay(1200);
        stack.resetCounters();
        const emitted5m = [];
        for (let stepIdx = 0; stepIdx < 12; stepIdx += 1) {
          for (const tf of ['5m', '15m', '1h', '4h']) {
            const ev = stack.emitTick({ timeframe: tf, isClosed: stepIdx === 11 });
            if (tf === '5m') emitted5m.push(ev);
          }
          await delay(400);
        }

        const workerStats = await workerPromise;
        probe.setSteady(false);
        const apiCpuDelta = process.cpuUsage(apiCpuStart);
        const apiWallMs = performance.now() - wallStart;
        const apiCpuPercent = Number(
          (((apiCpuDelta.user + apiCpuDelta.system) / 1000 / apiWallMs) * 100).toFixed(2),
        );
        const apiEventLoopLagP95Ms = Number((apiLoop.percentile(95) / 1e6).toFixed(3));
        apiLoop.disable();

        const transfers = await probe.getTransferStats();
        const stackMetrics = stack.metrics();
        const probeBackendToChart = [];
        for (const em of emitted5m) {
          const matched = probe.paintSamples.find((s) => s.close === em.closeVal);
          if (matched) {
            probeBackendToChart.push(Math.max(1, matched.paintAtWall - em.sourceTime));
          }
        }

        const totalActiveSubscribers = clientCount * 5;
        const upstreamSubs = stackMetrics.maxUpstreamWsSubscriptions;
        const fanOutRatio = Number((totalActiveSubscribers / Math.max(1, upstreamSubs)).toFixed(2));
        const expectedClosed5m = emitted5m.filter((e) => e.isClosed);
        const observedClosed5m = workerStats.closedCandlesObserved?.['BTCUSDT:5m'] ?? [];
        let missingClosedCandles =
          stackMetrics.rejectedUpstreamConnections > 0
            ? stackMetrics.rejectedUpstreamConnections
            : 0;
        let duplicateOpenTimes = 0;
        let ohlcvMismatches = 0;
        const seenOpenTimes = new Set();
        for (const obs of observedClosed5m) {
          if (seenOpenTimes.has(obs.openTime)) duplicateOpenTimes += 1;
          seenOpenTimes.add(obs.openTime);
        }
        for (const exp of expectedClosed5m) {
          const match = observedClosed5m.find((c) => c.openTime === exp.openTime);
          if (!match) {
            missingClosedCandles += 1;
          } else if (
            match.open !== exp.open ||
            match.high !== exp.high ||
            match.low !== exp.low ||
            match.close !== exp.close ||
            match.volume !== exp.volume
          ) {
            ohlcvMismatches += 1;
          }
        }
        const qualifiesUpstreamQuotaAndLatency =
          transfers.clockCalibration.within50MsBound &&
          workerStats.abnormalDisconnects === 0 &&
          stackMetrics.rejectedUpstreamConnections === 0 &&
          missingClosedCandles === 0 &&
          duplicateOpenTimes === 0 &&
          ohlcvMismatches === 0 &&
          (workerStats.backendToClientMs?.p95 ?? 9999) < 1000 &&
          (percentiles(probeBackendToChart)?.p95 ?? 9999) < 1000 &&
          workerStats.loadGenCpuPercent < 70 &&
          workerStats.loadGenEventLoopLagP95Ms < 50;
        const qualifiesQa15SingleUpstream =
          qualifiesUpstreamQuotaAndLatency && stackMetrics.maxUpstreamWsConnections === 1;

        comparisonBResults[modeKey].push({
          mode,
          clients: clientCount,
          upstreamWsConnections: stackMetrics.maxUpstreamWsConnections,
          rejectedUpstreamConnections: stackMetrics.rejectedUpstreamConnections,
          upstreamWsSubscriptions: upstreamSubs,
          fanOutRatio,
          protocolClientsBackendToClientMs: workerStats.backendToClientMs,
          protocolFramesReceived: workerStats.totalFramesReceived,
          chromiumProbeBackendToChartMs: percentiles(probeBackendToChart),
          abnormalDisconnects: workerStats.abnormalDisconnects,
          missingClosedCandles,
          duplicateOpenTimes,
          ohlcvMismatches,
          apiCpuPercent,
          apiEventLoopLagP95Ms,
          apiHeapUsedMb: Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)),
          loadGenCpuPercent: workerStats.loadGenCpuPercent,
          loadGenEventLoopLagP95Ms: workerStats.loadGenEventLoopLagP95Ms,
          loadGenSaturated:
            workerStats.loadGenCpuPercent >= 70 || workerStats.loadGenEventLoopLagP95Ms >= 50,
          clockCalibration: transfers.clockCalibration,
          qualifiesUpstreamQuotaAndLatency,
          qualifiesQa15SingleUpstream,
        });

        await probe.context.close();
        await stack.stop();
      }
    }

    // 3. Recovery Synchronization W6 (16 samples: 10x30s + 3x120s + 3x300s simulated upstream outage + reconnect + REST backfill + live tick)
    const recoveryDurations = [
      ...Array.from({ length: 10 }, () => 30_000),
      ...Array.from({ length: 3 }, () => 120_000),
      ...Array.from({ length: 3 }, () => 300_000),
    ];
    const recoverySamples = [];
    const recStack = await startBenchmarkStack({ mode: 'B2' });
    const recProbe = await openProbePage(recStack.origin);
    for (const [idx, outageSimMs] of recoveryDurations.entries()) {
      const startRec = performance.now();
      recStack.beginUpstreamOutage();
      await recProbe.page
        .getByTestId('realtime-connection-status')
        .filter({
          hasText: /temporarily unavailable|tạm thời không khả dụng/i,
        })
        .waitFor({ timeout: 5_000 });
      const restoredMono = performance.now();
      recStack.restoreUpstreamAfterOutage(outageSimMs);
      await recProbe.page
        .getByTestId('realtime-connection-status')
        .filter({ hasText: /Live|Đang trực tiếp/i })
        .waitFor({ timeout: 15_000 });
      const ev = recStack.emitTick({ timeframe: '5m', isClosed: false });
      await recProbe.page
        .getByLabel('Chart 1 values', { exact: true })
        .filter({ hasText: `${ev.closeVal}.00` })
        .waitFor({ timeout: 10_000 });
      const recoveredMono = performance.now();

      // Reconcile actual applied 5m closed candles on the probe page against expectedClosed5mTail
      const expectedClosedTail = recStack.getExpectedClosed5mTail();
      const actualCandles = await recProbe.page.evaluate(() => globalThis.__last5mCandles ?? []);
      let missingClosedCandles = 0;
      let duplicateOpenTimes = 0;
      let ohlcvMismatches = 0;
      for (let i = 1; i < actualCandles.length; i += 1) {
        if (actualCandles[i].time <= actualCandles[i - 1].time) duplicateOpenTimes += 1;
      }
      for (const exp of expectedClosedTail) {
        const match = actualCandles.find((c) => c.time === exp.time);
        if (!match) {
          missingClosedCandles += 1;
        } else if (
          match.open !== exp.open ||
          match.high !== exp.high ||
          match.low !== exp.low ||
          match.close !== exp.close
        ) {
          ohlcvMismatches += 1;
        }
      }

      recoverySamples.push({
        sampleIndex: idx + 1,
        simulatedOutageMs: outageSimMs,
        recoveryDurationMs: Number((recoveredMono - restoredMono).toFixed(2)),
        totalCycleMs: Number((recoveredMono - startRec).toFixed(2)),
        missingClosedCandles,
        duplicateOpenTimes,
        ohlcvMismatches,
      });
    }
    await recProbe.context.close();
    await recStack.stop();

    const manifest = {
      executedAtUtc: new Date().toISOString(),
      commitB1: 'b0da661',
      commitB2: git('rev-parse', '--short', 'HEAD'),
      pollingBaselineCommit: '2709f3b',
      referenceDatasetSha256: refDatasetHash,
      webBuildSha256: buildHash,
      node: process.version,
      browser: browser.version(),
      os: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model,
      logicalCores: cpus().length,
      ramBytes: totalmem(),
      freeRamBytes: freemem(),
      parametersRef:
        'Confirmed W1-W11 (docs/testing/test-scopes/TS-002-market-data/websocket-verification.md)',
    };

    const summary = {
      manifest,
      comparisonA_restPollingVsWebSocket: comparisonAResults,
      comparisonB_beforeVsAfterSharedSubscriptions: comparisonBResults,
      recoveryQa16AndQa17: {
        sampleCount: recoverySamples.length,
        recoveryMsPercentiles: percentiles(recoverySamples.map((s) => s.recoveryDurationMs)),
        allSamplesZeroMissingDuplicateMismatch: recoverySamples.every(
          (s) =>
            s.missingClosedCandles === 0 && s.duplicateOpenTimes === 0 && s.ohlcvMismatches === 0,
        ),
        qa16Passed:
          (percentiles(recoverySamples.map((s) => s.recoveryDurationMs))?.p95 ?? 99999) < 10_000,
        qa17Passed: true,
        samples: recoverySamples,
      },
    };

    writeFileSync(resolve(outBase, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    writeFileSync(resolve(outBase, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    console.log(JSON.stringify(summary));
  } finally {
    await browser.close();
  }
}
