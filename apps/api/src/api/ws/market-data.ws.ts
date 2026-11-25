import { randomUUID } from 'node:crypto';
import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { wsClientMessageSchema, type MarketChannel, type WsErrorCode } from '@crypto-force/shared';
import { fromNodeHeaders } from 'better-auth/node';
import type { Logger } from 'pino';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import type { Auth } from '../../configs/auth';
import type { MarketDataStreamHub } from '../../services/market-data-stream.service';
import type { WsSessionService } from '../../services/ws-session.service';

const WS_PATH = '/api/market-data/ws';
const MAX_CHANNELS_PER_CONNECTION = 10;
const MAX_PAYLOAD_BYTES = 4_096;
const RATE_LIMIT_MAX_MESSAGES = 20;
const RATE_LIMIT_WINDOW_MS = 10_000;
const MAX_BUFFERED_BYTES = 65_536;
const HEARTBEAT_INTERVAL_MS = 5_000;
const MEMORY_SESSION_CHECK_MS = 1_000;
const DB_SESSION_CHECK_MS = 3_000;

export interface MarketDataWsGateway {
  revokeSession(sessionId: string): void;
  close(): Promise<void>;
}

interface ClientConnection {
  id: string;
  ws: WebSocket;
  userId: string;
  sessionId: string;
  expiresAt: number;
  channels: Map<string, MarketChannel>;
  messageTimestamps: number[];
  closed: boolean;
}

function channelKey(channel: MarketChannel): string {
  return channel.kind === 'kline'
    ? `kline:${channel.pair}:${channel.timeframe}`
    : `summary:${channel.pair}`;
}

function rawDataToString(raw: RawData): string {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}

function rejectUpgrade(socket: Duplex, statusCode: 401 | 403, statusText: string) {
  socket.write(`HTTP/1.1 ${String(statusCode)} ${statusText}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function isTlsRequest(req: IncomingMessage): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string' && forwardedProto.toLowerCase() === 'https') {
    return true;
  }
  return 'encrypted' in req.socket && Boolean((req.socket as { encrypted?: boolean }).encrypted);
}

export function attachMarketDataWs({
  server,
  auth,
  wsSessionService,
  streamHub,
  allowedOrigin,
  requireTls,
  maxConnectionsPerUser,
  logger,
  now,
}: {
  server: Server;
  auth: Auth;
  wsSessionService: WsSessionService;
  streamHub: MarketDataStreamHub;
  allowedOrigin: string;
  requireTls: boolean;
  maxConnectionsPerUser: number;
  logger: Logger;
  now: () => number;
}): MarketDataWsGateway {
  const expectedOrigin = new URL(allowedOrigin).origin;
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD_BYTES });
  const connections = new Map<string, ClientConnection>();
  const userConnections = new Map<string, Set<ClientConnection>>();
  const sessionConnections = new Map<string, Set<ClientConnection>>();
  let closing = false;
  let dbCheckRunning = false;

  function sendError(ws: WebSocket, code: WsErrorCode, message: string) {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'error', code, message }));
  }

  function cleanupConnection(client: ClientConnection, closeCode?: number) {
    if (client.closed) return;
    client.closed = true;
    connections.delete(client.id);
    const byUser = userConnections.get(client.userId);
    if (byUser) {
      byUser.delete(client);
      if (byUser.size === 0) userConnections.delete(client.userId);
    }
    const bySession = sessionConnections.get(client.sessionId);
    if (bySession) {
      bySession.delete(client);
      if (bySession.size === 0) sessionConnections.delete(client.sessionId);
    }
    client.channels.clear();
    streamHub.removeClient(client.id);
    if (closeCode !== undefined) {
      logger.info(
        { path: WS_PATH, clientId: client.id, closeCode },
        'Market data WebSocket connection closed.',
      );
    }
  }

  function closeSlowConsumer(client: ClientConnection) {
    if (client.closed) return;
    const bufferedAmount = client.ws.bufferedAmount;
    logger.warn(
      { path: WS_PATH, clientId: client.id, closeCode: 4008, bufferedAmount },
      'Closed slow WebSocket consumer.',
    );
    cleanupConnection(client);
    if (client.ws.readyState === WebSocket.OPEN || client.ws.readyState === WebSocket.CONNECTING) {
      client.ws.close(4008, 'Slow consumer');
    }
  }

  function deliverFrame(client: ClientConnection, frame: string) {
    if (client.closed || client.ws.readyState !== WebSocket.OPEN) return;
    if (client.ws.bufferedAmount > MAX_BUFFERED_BYTES) {
      closeSlowConsumer(client);
      return;
    }
    client.ws.send(frame);
    if (client.ws.bufferedAmount > MAX_BUFFERED_BYTES) {
      closeSlowConsumer(client);
    }
  }

  function revokeSessions(sessionIds: string[]) {
    let closedCount = 0;
    for (const sessionId of sessionIds) {
      const targets = sessionConnections.get(sessionId);
      if (!targets || targets.size === 0) continue;
      for (const client of [...targets]) {
        closedCount += 1;
        cleanupConnection(client);
        if (
          client.ws.readyState === WebSocket.OPEN ||
          client.ws.readyState === WebSocket.CONNECTING
        ) {
          client.ws.close(4401, 'Session expired or revoked');
        }
      }
    }
    if (closedCount > 0) {
      logger.info(
        { path: WS_PATH, closeCode: 4401, revokedWsSessionsCount: closedCount },
        'Closed WebSocket connections after session expiration or revocation.',
      );
    }
  }

  function handleClientMessage(client: ClientConnection, raw: RawData) {
    const current = now();
    while (
      client.messageTimestamps.length > 0 &&
      current - (client.messageTimestamps[0] ?? 0) >= RATE_LIMIT_WINDOW_MS
    ) {
      client.messageTimestamps.shift();
    }
    if (client.messageTimestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
      sendError(client.ws, 'RATE_LIMITED', 'Too many messages were sent.');
      logger.warn(
        { path: WS_PATH, clientId: client.id, closeCode: 4429, reason: 'RATE_LIMITED' },
        'Closed WebSocket connection after exceeding message rate limit.',
      );
      cleanupConnection(client);
      client.ws.close(4429, 'Rate limit exceeded');
      return;
    }
    client.messageTimestamps.push(current);

    let json: unknown;
    try {
      json = JSON.parse(rawDataToString(raw));
    } catch {
      sendError(client.ws, 'INVALID_MESSAGE', 'The message is invalid.');
      return;
    }

    const parsed = wsClientMessageSchema.safeParse(json);
    if (!parsed.success) {
      sendError(client.ws, 'INVALID_MESSAGE', 'The message is invalid.');
      return;
    }

    if (parsed.data.type === 'subscribe') {
      const nextChannels = new Map(client.channels);
      for (const channel of parsed.data.channels) {
        nextChannels.set(channelKey(channel), channel);
      }
      if (nextChannels.size > MAX_CHANNELS_PER_CONNECTION) {
        sendError(client.ws, 'SUBSCRIPTION_LIMIT_EXCEEDED', 'The subscription limit was exceeded.');
        return;
      }
      for (const [key, channel] of nextChannels) {
        if (!client.channels.has(key)) {
          client.channels.set(key, channel);
          streamHub.subscribe(client.id, channel, (frame) => {
            deliverFrame(client, frame);
          });
        }
      }
      deliverFrame(
        client,
        JSON.stringify({ type: 'subscribed', channels: [...client.channels.values()] }),
      );
      return;
    }

    for (const channel of parsed.data.channels) {
      const key = channelKey(channel);
      if (client.channels.delete(key)) {
        streamHub.unsubscribe(client.id, channel);
      }
    }
    deliverFrame(
      client,
      JSON.stringify({ type: 'unsubscribed', channels: [...client.channels.values()] }),
    );
  }

  // Forward upstream status to connected clients that have not yet subscribed to any channel.
  const unsubscribeHubStatus = streamHub.onStatus((status) => {
    const frame = JSON.stringify({
      type: 'status',
      upstream: status.upstream,
      resyncRequired: status.resyncRequired,
      serverTime: now(),
    });
    for (const client of connections.values()) {
      if (client.channels.size === 0) {
        deliverFrame(client, frame);
      }
    }
  });

  const heartbeatTimer = setInterval(() => {
    if (closing || connections.size === 0 || !streamHub.isUpstreamAvailable()) return;
    const frame = JSON.stringify({ type: 'heartbeat', serverTime: now() });
    for (const client of [...connections.values()]) {
      deliverFrame(client, frame);
    }
  }, HEARTBEAT_INTERVAL_MS);

  const memorySessionTimer = setInterval(() => {
    if (closing || connections.size === 0) return;
    const active = [...connections.values()].map((client) => ({
      sessionId: client.sessionId,
      expiresAt: client.expiresAt,
    }));
    const expired = wsSessionService.findExpiredInMemory(active);
    if (expired.length > 0) revokeSessions(expired);
  }, MEMORY_SESSION_CHECK_MS);

  const dbSessionTimer = setInterval(() => {
    if (closing || dbCheckRunning || connections.size === 0) return;
    dbCheckRunning = true;
    const start = performance.now();
    const active = [...connections.values()].map((client) => ({
      sessionId: client.sessionId,
      expiresAt: client.expiresAt,
    }));
    void wsSessionService
      .findExpiredOrRevoked(active)
      .then((revoked) => {
        const sessionRevalidationDurationMs = performance.now() - start;
        if (revoked.length > 0) {
          revokeSessions(revoked);
        }
        logger.debug(
          {
            path: WS_PATH,
            sessionRevalidationDurationMs,
            checkedConnections: active.length,
            revokedCount: revoked.length,
          },
          'Completed batch WebSocket session revalidation.',
        );
      })
      .catch((error: unknown) => {
        logger.warn({ path: WS_PATH, err: error }, 'Failed batch WebSocket session revalidation.');
      })
      .finally(() => {
        dbCheckRunning = false;
      });
  }, DB_SESSION_CHECK_MS);

  const handleUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const pathname = (req.url ?? '').split('?')[0];
    if (pathname !== WS_PATH) return;
    if (closing) {
      rejectUpgrade(socket, 403, 'Forbidden');
      return;
    }

    const origin = req.headers.origin;
    if (!origin || origin !== expectedOrigin) {
      logger.warn(
        { path: WS_PATH, upgradeStatus: 403, reason: 'origin' },
        'Rejected WebSocket upgrade with invalid origin.',
      );
      rejectUpgrade(socket, 403, 'Forbidden');
      return;
    }

    if (requireTls && !isTlsRequest(req)) {
      logger.warn(
        { path: WS_PATH, upgradeStatus: 403, reason: 'tls' },
        'Rejected non-TLS WebSocket upgrade in production.',
      );
      rejectUpgrade(socket, 403, 'Forbidden');
      return;
    }

    void auth.api
      .getSession({ headers: fromNodeHeaders(req.headers) })
      .then((sessionResult) => {
        if (!sessionResult || sessionResult.session.expiresAt.getTime() <= now()) {
          logger.warn(
            { path: WS_PATH, upgradeStatus: 401 },
            'Rejected unauthenticated WebSocket upgrade.',
          );
          rejectUpgrade(socket, 401, 'Unauthorized');
          return;
        }

        const userId = sessionResult.user.id;
        const sessionId = sessionResult.session.id;
        const expiresAt = sessionResult.session.expiresAt.getTime();

        wss.handleUpgrade(req, socket, head, (ws) => {
          const existingForUser = userConnections.get(userId);
          if ((existingForUser?.size ?? 0) >= maxConnectionsPerUser) {
            sendError(
              ws,
              'CONNECTION_LIMIT_EXCEEDED',
              'Too many live tabs are open for this account.',
            );
            logger.warn(
              {
                path: WS_PATH,
                closeCode: 4429,
                reason: 'CONNECTION_LIMIT_EXCEEDED',
                activeUserConnections: existingForUser?.size ?? 0,
              },
              'Rejected WebSocket connection above per-account limit.',
            );
            ws.close(4429, 'Connection limit exceeded');
            return;
          }

          const client: ClientConnection = {
            id: randomUUID(),
            ws,
            userId,
            sessionId,
            expiresAt,
            channels: new Map(),
            messageTimestamps: [],
            closed: false,
          };
          connections.set(client.id, client);
          const userSet = userConnections.get(userId) ?? new Set<ClientConnection>();
          userSet.add(client);
          userConnections.set(userId, userSet);
          const sessionSet = sessionConnections.get(sessionId) ?? new Set<ClientConnection>();
          sessionSet.add(client);
          sessionConnections.set(sessionId, sessionSet);

          logger.info(
            { path: WS_PATH, upgradeStatus: 101, clientId: client.id },
            'Accepted market data WebSocket connection.',
          );

          if (!streamHub.isUpstreamAvailable()) {
            deliverFrame(
              client,
              JSON.stringify({
                type: 'status',
                upstream: 'unavailable',
                resyncRequired: false,
                serverTime: now(),
              }),
            );
          }

          ws.on('message', (raw) => {
            handleClientMessage(client, raw);
          });
          ws.on('close', (code) => {
            cleanupConnection(client, code);
          });
          ws.on('error', () => {
            cleanupConnection(client);
          });
        });
      })
      .catch((error: unknown) => {
        logger.warn({ path: WS_PATH, err: error }, 'WebSocket upgrade session check failed.');
        rejectUpgrade(socket, 401, 'Unauthorized');
      });
  };

  server.on('upgrade', handleUpgrade);

  return {
    revokeSession(sessionId) {
      revokeSessions([sessionId]);
    },
    async close() {
      if (closing) return;
      closing = true;
      clearInterval(heartbeatTimer);
      clearInterval(memorySessionTimer);
      clearInterval(dbSessionTimer);
      unsubscribeHubStatus();
      server.off('upgrade', handleUpgrade);

      const openClients = [...connections.values()];
      await Promise.all(
        openClients.map(
          (client) =>
            new Promise<void>((resolve) => {
              cleanupConnection(client);
              if (client.ws.readyState === WebSocket.CLOSED) {
                resolve();
                return;
              }
              client.ws.once('close', () => {
                resolve();
              });
              client.ws.close(1001, 'Server shutting down');
            }),
        ),
      );

      await new Promise<void>((resolve) => {
        wss.close(() => {
          resolve();
        });
      });
    },
  };
}
