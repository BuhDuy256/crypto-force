import { once } from 'node:events';
import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3096;
const DEFAULT_INTERVAL_MS = 500;
const BASE_OPEN_TIME_MS = 1_735_689_600_000;
const CLOSED_CANDLE_EVERY = 120;
const FAULT_CHANNEL_KEY = 'kline:BTCUSDT:1m';
const FAULT_MODES = new Set(['drop-one', 'duplicate-one', 'invalid-payload']);

export const BENCHMARK_CHANNELS = [
  { kind: 'kline', pair: 'BTCUSDT', timeframe: '1m', key: 'kline:BTCUSDT:1m', intervalMs: 60_000 },
  {
    kind: 'kline',
    pair: 'BTCUSDT',
    timeframe: '5m',
    key: 'kline:BTCUSDT:5m',
    intervalMs: 300_000,
  },
  { kind: 'kline', pair: 'ETHUSDT', timeframe: '1m', key: 'kline:ETHUSDT:1m', intervalMs: 60_000 },
  { kind: 'kline', pair: 'SOLUSDT', timeframe: '1m', key: 'kline:SOLUSDT:1m', intervalMs: 60_000 },
  { kind: 'summary', pair: 'BTCUSDT', key: 'summary:BTCUSDT', intervalMs: 0 },
];

export function channelToStreamName(channel) {
  const symbol = channel.pair.toLowerCase();
  return channel.kind === 'kline' ? `${symbol}@kline_${channel.timeframe}` : `${symbol}@ticker`;
}

export function buildUpstreamFrame({ channel, seq, openTimeMs, isClosed, nowMs, invalidPayload }) {
  const stream = channelToStreamName(channel);
  if (channel.kind === 'kline') {
    return {
      stream,
      data: {
        e: 'kline',
        E: nowMs,
        s: channel.pair,
        k: {
          t: openTimeMs,
          i: channel.timeframe,
          o: '50000.00',
          h: invalidPayload ? '49000.00' : '50100.00',
          l: '49990.00',
          c: (50000 + (seq % 100) * 0.01).toFixed(2),
          v: String(seq),
          x: isClosed,
        },
      },
    };
  }
  return {
    stream,
    data: {
      e: '24hrTicker',
      E: nowMs,
      s: channel.pair,
      c: invalidPayload ? '-1.00' : (60000 + seq * 0.01).toFixed(2),
      P: '1.25',
    },
  };
}

function emptyEventLedger() {
  return Object.fromEntries(BENCHMARK_CHANNELS.map((channel) => [channel.key, []]));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
}

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  response.end(payload);
}

export async function startReplayServer({
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  intervalMs = DEFAULT_INTERVAL_MS,
} = {}) {
  const wss = new WebSocketServer({ noServer: true });
  const subscriptionsBySocket = new Map();
  const openTimes = new Map(BENCHMARK_CHANNELS.map((channel) => [channel.key, BASE_OPEN_TIME_MS]));
  const vuReports = [];

  let maxUpstreamConnections = 0;
  let phase = 'warmup';
  let steadySeq = 0;
  let steadyStartMs = null;
  let steadyEndMs = null;
  let faultMode = null;
  let faultApplied = false;
  let eventsByChannel = emptyEventLedger();

  function totalSteadyEvents() {
    return Object.values(eventsByChannel).reduce((total, seqs) => total + seqs.length, 0);
  }

  function subscribedStreams() {
    const streams = new Set();
    for (const subscriptions of subscriptionsBySocket.values()) {
      for (const streamName of subscriptions) streams.add(streamName);
    }
    return [...streams].sort();
  }

  function handleClientCommand(socket, raw) {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (typeof message?.id !== 'number' || !Array.isArray(message.params)) return;
    const method = typeof message.method === 'string' ? message.method.toUpperCase() : '';
    if (method !== 'SUBSCRIBE' && method !== 'UNSUBSCRIBE') return;
    const subscriptions = subscriptionsBySocket.get(socket);
    if (!subscriptions) return;
    for (const streamName of message.params) {
      if (typeof streamName !== 'string') continue;
      if (method === 'SUBSCRIBE') subscriptions.add(streamName);
      else subscriptions.delete(streamName);
    }
    socket.send(JSON.stringify({ id: message.id, result: null }));
  }

  function tick() {
    const nowMs = Date.now();
    const steady = phase === 'steady';
    if (steady) steadySeq += 1;
    const seq = steady ? steadySeq : 0;
    const isClosed = steady && steadySeq % CLOSED_CANDLE_EVERY === 0;

    for (const channel of BENCHMARK_CHANNELS) {
      const streamName = channelToStreamName(channel);
      const targets = [];
      for (const [socket, subscriptions] of subscriptionsBySocket) {
        if (subscriptions.has(streamName)) targets.push(socket);
      }
      if (targets.length === 0) continue;

      const isFaultTick =
        steady &&
        steadySeq === 1 &&
        channel.key === FAULT_CHANNEL_KEY &&
        faultMode !== null &&
        !faultApplied;
      if (isFaultTick) faultApplied = true;

      const openTimeMs = openTimes.get(channel.key) ?? BASE_OPEN_TIME_MS;
      const frame = buildUpstreamFrame({
        channel,
        seq,
        openTimeMs,
        isClosed,
        nowMs,
        invalidPayload: isFaultTick && faultMode === 'invalid-payload',
      });
      if (steady) eventsByChannel[channel.key].push(seq);
      if (isFaultTick && faultMode === 'drop-one') continue;

      const payload = JSON.stringify(frame);
      for (const socket of targets) {
        if (socket.readyState !== WebSocket.OPEN) continue;
        socket.send(payload);
        if (isFaultTick && faultMode === 'duplicate-one') socket.send(payload);
      }
      if (isClosed) openTimes.set(channel.key, openTimeMs + channel.intervalMs);
    }
  }

  async function handleRequest(request, response) {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    const method = request.method ?? 'GET';

    if (method === 'POST' && pathname === '/start-steady') {
      phase = 'steady';
      steadySeq = 0;
      eventsByChannel = emptyEventLedger();
      steadyStartMs = Date.now();
      steadyEndMs = null;
      faultApplied = false;
      sendJson(response, 200, { phase });
      return;
    }

    if (method === 'POST' && pathname === '/stop-steady') {
      phase = 'drain';
      steadyEndMs = Date.now();
      sendJson(response, 200, { phase });
      return;
    }

    if (method === 'POST' && pathname === '/fault') {
      const body = await readJsonBody(request);
      const mode = body?.mode ?? null;
      if (mode !== null && !FAULT_MODES.has(mode)) {
        sendJson(response, 400, { error: 'INVALID_FAULT_MODE' });
        return;
      }
      faultMode = mode;
      faultApplied = false;
      sendJson(response, 200, { faultMode });
      return;
    }

    if (method === 'POST' && pathname === '/vu-report') {
      const body = await readJsonBody(request);
      if (typeof body !== 'object' || body === null) {
        sendJson(response, 400, { error: 'INVALID_REPORT' });
        return;
      }
      vuReports.push(body);
      sendJson(response, 200, { received: vuReports.length });
      return;
    }

    if (method === 'GET' && pathname === '/ledger') {
      sendJson(response, 200, {
        upstreamConnections: subscriptionsBySocket.size,
        maxUpstreamConnections,
        subscribedStreams: subscribedStreams(),
        steadyStartMs,
        steadyEndMs,
        eventsByChannel,
        totalSteadyEvents: totalSteadyEvents(),
        vuReports,
        faultMode,
      });
      return;
    }

    sendJson(response, 404, { error: 'NOT_FOUND' });
  }

  const httpServer = createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end();
    });
  });

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    if (pathname !== '/stream') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client, request);
    });
  });

  wss.on('connection', (client) => {
    subscriptionsBySocket.set(client, new Set());
    maxUpstreamConnections = Math.max(maxUpstreamConnections, subscriptionsBySocket.size);
    client.on('message', (raw) => handleClientCommand(client, raw));
    client.on('error', () => undefined);
    client.on('close', () => subscriptionsBySocket.delete(client));
  });

  const listening = once(httpServer, 'listening');
  httpServer.listen(port, host);
  await listening;

  const address = httpServer.address();
  const boundPort = typeof address === 'object' && address !== null ? address.port : port;
  const timer = setInterval(tick, intervalMs);

  return {
    port: boundPort,
    wsUrl: `ws://${host}:${boundPort}/stream`,
    httpUrl: `http://${host}:${boundPort}`,
    async close() {
      clearInterval(timer);
      for (const client of subscriptionsBySocket.keys()) client.terminate();
      subscriptionsBySocket.clear();
      for (const client of wss.clients) client.terminate();
      wss.close();
      const closed = new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
      httpServer.closeAllConnections();
      await closed;
    },
  };
}

function readFlag(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

if (process.argv[1]?.endsWith('replay-ws.mjs')) {
  const argv = process.argv.slice(2);
  const portFlag = readFlag(argv, '--port');
  const intervalFlag = readFlag(argv, '--interval-ms');
  const server = await startReplayServer({
    port: portFlag === undefined ? DEFAULT_PORT : Number(portFlag),
    intervalMs: intervalFlag === undefined ? DEFAULT_INTERVAL_MS : Number(intervalFlag),
  });
  console.log(
    JSON.stringify({
      ready: true,
      port: server.port,
      wsUrl: server.wsUrl,
      httpUrl: server.httpUrl,
    }),
  );
  const shutdown = async () => {
    await server.close();
    process.exitCode = 0;
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
