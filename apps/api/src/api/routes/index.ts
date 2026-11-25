import type { AuthConfig } from '@crypto-force/shared';
import { Router } from 'express';
import { createAuthConfigRouter } from './auth-config.route';
import { healthRouter } from './health.route';
import type { Auth } from '../../configs/auth';
import type { createMarketDataService } from '../../services/market-data.service';
import { createMarketDataRouter } from './market-data.route';

interface ApiRouterDependencies {
  authConfig: AuthConfig;
  auth: Auth;
  marketDataService: ReturnType<typeof createMarketDataService>;
}

export function createApiRouter({ authConfig, auth, marketDataService }: ApiRouterDependencies) {
  const apiRouter = Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth-config', createAuthConfigRouter(authConfig));
  apiRouter.use('/market-data', createMarketDataRouter({ auth, marketDataService }));
  return apiRouter;
}
