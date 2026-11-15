import { createApp } from './app';
import { env } from './configs/env';
import { logger } from './configs/logger';
import { createDatabase } from './database/client';

const { pool } = createDatabase(env.DATABASE_URL);
const app = createApp(logger);

const server = app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, 'API listening');
});

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Shutting down API');
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
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
