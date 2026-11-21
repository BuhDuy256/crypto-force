import type { AuthConfig } from '@crypto-force/shared';
import { toNodeHandler } from 'better-auth/node';
import express, { type Request, type Response } from 'express';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { errorHandler, notFoundHandler } from './api/middlewares/error-handler.middleware';
import { securityHeaders } from './api/middlewares/security-headers.middleware';
import { createApiRouter } from './api/routes/index';
import type { Auth } from './configs/auth';
import type { MarketDataProvider } from './providers/market-data/market-data-provider';
import { createMarketDataService } from './services/market-data.service';

interface AppDependencies {
  logger: Logger;
  auth: Auth;
  authConfig: AuthConfig;
  marketDataProvider: MarketDataProvider;
}

function httpLogPath(req: Request): string {
  const path = req.originalUrl.split('?')[0];
  switch (path) {
    case '/api/health':
    case '/api/auth-config':
    case '/api/market-data/candles':
    case '/api/market-data/summary':
      return path;
    default:
      return path?.startsWith('/api/auth/') ? '/api/auth/{*splat}' : '/unmatched';
  }
}

export function createApp({ logger, auth, authConfig, marketDataProvider }: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    pinoHttp<Request, Response>({
      logger,
      wrapSerializers: false,
      serializers: {
        req: (req: Request) => ({ method: req.method, path: httpLogPath(req) }),
        res: (res: Response) => ({ status: res.statusCode }),
        err: () => ({ type: 'Error' }),
      },
      customSuccessObject: (req, res, value: { responseTime?: number }) => ({
        method: req.method,
        path: httpLogPath(req),
        status: res.statusCode,
        durationMs: value.responseTime,
      }),
      customErrorObject: (req, res, _error, value: { responseTime?: number }) => ({
        method: req.method,
        path: httpLogPath(req),
        status: res.statusCode,
        durationMs: value.responseTime,
      }),
      customSuccessMessage: () => 'The HTTP request completed.',
      customErrorMessage: () => 'The HTTP request completed.',
    }),
  );
  app.use(securityHeaders);

  // Better Auth parses its own request bodies, so it is mounted before express.json().
  app.all('/api/auth/{*splat}', toNodeHandler(auth));

  app.use(express.json());
  const marketDataService = createMarketDataService({ provider: marketDataProvider, logger });
  app.use('/api', createApiRouter({ authConfig, auth, marketDataService }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
