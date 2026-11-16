import type { AuthConfig } from '@crypto-force/shared';
import { Router } from 'express';
import { createAuthConfigRouter } from './auth-config.route';
import { healthRouter } from './health.route';

interface ApiRouterDependencies {
  authConfig: AuthConfig;
}

export function createApiRouter({ authConfig }: ApiRouterDependencies) {
  const apiRouter = Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth-config', createAuthConfigRouter(authConfig));
  return apiRouter;
}
