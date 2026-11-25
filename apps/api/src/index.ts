import { createApp } from './app';
import { attachMarketDataWs } from './api/ws/market-data.ws';
import { createAuth, isGoogleEnabled } from './configs/auth';
import { env } from './configs/env';
import { logger } from './configs/logger';
import { createDatabase } from './database/client';
import { createBinanceMarketDataProvider } from './providers/market-data/binance.provider';
import { createBinanceStreamProvider } from './providers/market-data/binance-stream.provider';
import { createCachedMarketDataProvider } from './providers/market-data/cached-market-data.provider';
import { createSessionRepository } from './repositories/session.repository';
import { createAuthEmails } from './services/auth-email.service';
import { createMailer } from './services/mailer';
import { createMarketDataStreamHub } from './services/market-data-stream.service';
import { createWsSessionService } from './services/ws-session.service';

const { db, pool } = createDatabase(env.DATABASE_URL, { max: env.DATABASE_POOL_MAX });
const mailer = createMailer(
  { nodeEnv: env.NODE_ENV, resendApiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM },
  logger,
);
const revokeRef: { current?: (sessionId: string) => void } = {};
const auth = createAuth({
  env,
  db,
  emails: createAuthEmails(mailer, env.BETTER_AUTH_URL),
  logger,
  onSessionRevoked(sessionId) {
    revokeRef.current?.(sessionId);
  },
});
const marketDataProvider = createCachedMarketDataProvider({
  provider: createBinanceMarketDataProvider({
    fetch: globalThis.fetch,
    now: Date.now,
    timeoutMs: 5000,
    logger,
  }),
  now: Date.now,
  ttlMs: 5000,
  logger,
});
const streamProvider = createBinanceStreamProvider({
  wsUrl: env.BINANCE_WS_URL,
  now: Date.now,
  logger,
});
const streamHub = createMarketDataStreamHub({
  streamProvider,
  onCandleClosed(pair, timeframe) {
    marketDataProvider.invalidateCandles(pair, timeframe);
  },
  now: Date.now,
  logger,
});
const wsSessionService = createWsSessionService({
  sessionRepository: createSessionRepository(db),
  now: Date.now,
});
const app = createApp({
  logger,
  auth,
  authConfig: { google: isGoogleEnabled(env) },
  marketDataProvider,
});

const server = app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, 'API listening');
});
const wsGateway = attachMarketDataWs({
  server,
  auth,
  wsSessionService,
  streamHub,
  allowedOrigin: env.BETTER_AUTH_URL,
  requireTls: env.NODE_ENV === 'production',
  maxConnectionsPerUser: env.WS_MAX_CONNECTIONS_PER_USER,
  logger,
  now: Date.now,
});
revokeRef.current = (sessionId) => {
  wsGateway.revokeSession(sessionId);
};

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Shutting down API');
  void wsGateway
    .close()
    .catch((wsError: unknown) => {
      logger.error({ err: wsError }, 'Failed to close WebSocket gateway');
    })
    .finally(() => {
      void streamHub
        .close()
        .catch((hubError: unknown) => {
          logger.error({ err: hubError }, 'Failed to close stream hub');
        })
        .finally(() => {
          server.close((serverError) => {
            pool
              .end()
              .catch((poolError: unknown) => {
                logger.error({ err: poolError }, 'Failed to close database pool');
              })
              .finally(() => {
                if (serverError) logger.error({ err: serverError }, 'Failed to close HTTP server');
                process.exit(serverError ? 1 : 0);
              });
          });
        });
    });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
