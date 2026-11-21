import { Router } from 'express';
import type { Auth } from '../../configs/auth';
import type { createMarketDataService } from '../../services/market-data.service';
import { createMarketDataController } from '../controllers/market-data.controller';
import { requireSession } from '../middlewares/session.middleware';

export function createMarketDataRouter({
  auth,
  marketDataService,
}: {
  auth: Auth;
  marketDataService: ReturnType<typeof createMarketDataService>;
}) {
  const router = Router();
  const controller = createMarketDataController(marketDataService);
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.use(requireSession(auth));
  router.get('/candles', controller.candles);
  router.get('/summary', controller.summary);
  return router;
}
