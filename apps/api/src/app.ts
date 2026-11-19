import type { AuthConfig } from '@crypto-force/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { errorHandler, notFoundHandler } from './api/middlewares/error-handler.middleware';
import { securityHeaders } from './api/middlewares/security-headers.middleware';
import { createApiRouter } from './api/routes/index';
import type { Auth } from './configs/auth';

interface AppDependencies {
  logger: Logger;
  auth: Auth;
  authConfig: AuthConfig;
}

export function createApp({ logger, auth, authConfig }: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(securityHeaders);

  // Better Auth parses its own request bodies, so it is mounted before express.json().
  app.all('/api/auth/{*splat}', toNodeHandler(auth));

  app.use(express.json());
  app.use('/api', createApiRouter({ authConfig }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
