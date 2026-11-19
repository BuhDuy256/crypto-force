import type { AuthConfig } from '@crypto-force/shared';
import { Router } from 'express';

/** Public auth options the web app reads before rendering the auth screens. */
export function createAuthConfigRouter(config: AuthConfig) {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json(config);
  });
  return router;
}
