import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket, WebSocketServer } from 'ws';
import { createBinanceStreamProvider } from '../../src/providers/market-data/binance-stream.provider.ts';
import { createMarketDataStreamHub } from '../../src/services/market-data-stream.service.ts';
import { attachMarketDataWs } from '../../src/api/ws/market-data.ws.ts';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const outDir = resolve(root, 'docs/testing/evidence/market-data/ws-diagnosis-v1');
mkdirSync(outDir, { recursive: true });

const timeline = [];
const t0Wall = Date.now();
const t0Mono = performance.now();
const nowCalibrated = () => Number((performance.now() - t0Mono).toFixed(3));

function pushRecord(layer, event, metrics = {}, pair = 'BTCUSDT', timeframe = '5m') {
  timeline.push({
    tsCalibratedMs: nowCalibrated(),
    utc: new Date(t0Wall + (performance.now() - t0Mono)).toISOString(),
    layer,
    pair,
    timeframe,
    event,
    metrics,
  });
}

const logger = {
  info(obj, msg) {
    pushRecord('api-log', msg, obj, obj?.pair ?? 'BTCUSDT', obj?.timeframe ?? '5m');
  },
  warn(obj, msg) {
    pushRecord('api-log-warn', msg, obj, obj?.pair ?? 'BTCUSDT', obj?.timeframe ?? '5m');
  },
  error(obj, msg) {
    pushRecord('api-log-error', msg, obj, obj?.pair ?? 'BTCUSDT', obj?.timeframe ?? '5m');
  },
  debug(obj, msg) {
    pushRecord('api-log-debug', msg, obj, obj?.pair ?? 'BTCUSDT', obj?.timeframe ?? '5m');
  },
};

// Setup fake upstream WS server + API WS gateway
const upstreamWss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
await once(upstreamWss, 'listening');
const upstreamPort = upstreamWss.address().port;
const upstreamSockets = new Set();
upstreamWss.on('connection', (sock) => {
  upstreamSockets.add(sock);
  sock.on('close', () => upstreamSockets.delete(sock));
  sock.on('message', (raw) => {
    const body = JSON.parse(raw.toString());
    if (body.id !== undefined) sock.send(JSON.stringify({ result: null, id: body.id }));
  });
});

const streamProvider = createBinanceStreamProvider({
  wsUrl: `ws://127.0.0.1:${upstreamPort}/stream`,
  now: Date.now,
  logger,
});
const streamHub = createMarketDataStreamHub({
  streamProvider,
  onCandleClosed: () => undefined,
  now: Date.now,
  logger,
});
const fakeAuth = {
  api: {
    getSession: ({ headers }) => {
      const cookie = headers.get('cookie') ?? '';
      const userId = cookie.includes('user2') ? 'user-2' : 'user-1';
      return Promise.resolve({
        user: { id: userId },
        session: { id: `sess-${userId}`, expiresAt: new Date(Date.now() + 3600_000) },
      });
    },
  },
};
const wsSessionService = {
  findExpiredInMemory: () => [],
  findExpiredOrRevoked: () => Promise.resolve([]),
};
const httpServer = createServer();
const gateway = attachMarketDataWs({
  server: httpServer,
  auth: fakeAuth,
  wsSessionService,
  streamHub,
  allowedOrigin: 'http://localhost:5173',
  requireTls: false,
  maxConnectionsPerUser: 4,
  logger,
  now: Date.now,
});
httpServer.listen(0, '127.0.0.1');
await once(httpServer, 'listening');
const apiPort = httpServer.address().port;
const apiWsUrl = `ws://127.0.0.1:${apiPort}/api/market-data/ws`;

async function openClient(name, cookie) {
  const ws = new WebSocket(apiWsUrl, {
    headers: { origin: 'http://localhost:5173', cookie },
  });
  await once(ws, 'open');
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'candle') {
      pushRecord('web-client', `${name}:candle_received`, {
        backendToClientMs: Date.now() - msg.dataTime,
        sourceToClientMs: msg.sourceTime ? Date.now() - msg.sourceTime : null,
      });
    } else if (msg.type === 'status') {
      pushRecord('web-client', `${name}:status_${msg.upstream}`, {
        resyncRequired: msg.resyncRequired,
      });
    }
  });
  ws.on('close', (code) => {
    pushRecord('web-client', `${name}:closed`, { closeCode: code });
  });
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channels: [{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }],
    }),
  );
  await delay(50);
  return ws;
}

const client1 = await openClient('client-healthy', 'session=user1');
const client2 = await openClient('client-target', 'session=user2');

function emitKline(sourceDelayMs = 10, closeOffset = 0) {
  const now = Date.now();
  const payload = JSON.stringify({
    stream: 'btcusdt@kline_5m',
    data: {
      e: 'kline',
      E: now - sourceDelayMs,
      s: 'BTCUSDT',
      k: {
        t: 1735689600000,
        i: '5m',
        o: '100.00',
        h: String(105 + closeOffset),
        l: '99.00',
        c: String(102 + closeOffset),
        v: '25.00',
        x: false,
      },
    },
  });
  for (const sock of upstreamSockets) sock.send(payload);
}

// Scenario 1: Upstream lag (2600 ms) followed by upstream drop
pushRecord('upstream', 'scenario_1_upstream_lag_and_drop_start', { injectedSourceDelayMs: 2600 });
emitKline(2600, 1);
await delay(50);
for (const sock of upstreamSockets) sock.close(1011, 'upstream drop');
await delay(1200);
emitKline(12, 2);
await delay(50);

// Scenario 2: Backend API CPU blocking (420 ms synchronous stall during dispatch)
pushRecord('api-hub', 'scenario_2_backend_cpu_stall_start', { injectedCpuBlockMs: 420 });
emitKline(10, 3);
const blockStart = performance.now();
while (performance.now() - blockStart < 420) {
  // Intentional synchronous CPU stall in API process
}
pushRecord('api-hub', 'scenario_2_backend_cpu_stall_end', {
  actualBlockMs: Number((performance.now() - blockStart).toFixed(2)),
});
emitKline(10, 4);
await delay(50);

// Scenario 3: Slow client (client2 pauses socket reading until 4008 SLOW_CONSUMER while client1 stays healthy)
pushRecord('web-client', 'scenario_3_slow_consumer_pause_start', { targetClient: 'client-target' });
client2._socket.pause();
for (let i = 0; i < 2000; i += 1) {
  emitKline(8, 5 + i * 0.125);
  if (timeline.some((r) => r.metrics?.closeCode === 4008)) break;
  if (i % 50 === 49) await new Promise((r) => setImmediate(r));
}
client2._socket.resume();
await delay(100);

client1.close(1000);
await gateway.close();
await streamHub.close();
upstreamWss.close();
httpServer.close();

const summary = {
  executedAtUtc: new Date().toISOString(),
  totalRecords: timeline.length,
  scenarios: {
    scenario1_upstreamLagAndDrop: {
      observedMaxUpstreamDelayMs: Math.max(
        ...timeline
          .filter((r) => typeof r.metrics?.upstreamDelayMs === 'number')
          .map((r) => r.metrics.upstreamDelayMs),
      ),
      observedDisconnectEvent: timeline.some((r) => r.metrics?.event === 'binance_ws_disconnected'),
      observedUnavailableStatusOnClient: timeline.some((r) =>
        r.event.endsWith(':status_unavailable'),
      ),
    },
    scenario2_backendCpuStall: {
      observedBackendStallMs:
        timeline.find((r) => r.event === 'scenario_2_backend_cpu_stall_end')?.metrics
          ?.actualBlockMs ?? null,
    },
    scenario3_slowConsumer: {
      observedSlowConsumerClose4008: timeline.some(
        (r) => r.layer === 'api-log-warn' && r.metrics?.closeCode === 4008,
      ),
      healthyClientRemainedOpen: !timeline.some(
        (r) => r.event === 'client-healthy:closed' && r.metrics?.closeCode === 4008,
      ),
    },
  },
};

writeFileSync(
  resolve(outDir, 'diagnosis-timeline.json'),
  JSON.stringify(timeline, null, 2),
  'utf8',
);
writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary));
