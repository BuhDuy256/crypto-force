import { PgBoss } from 'pg-boss';
import { env } from './configs/env';
import { logger } from './configs/logger';

const boss = new PgBoss(env.DATABASE_URL);

boss.on('error', (error) => {
  logger.error({ err: error }, 'pg-boss error');
});

await boss.start();
// Register job handlers from ./jobs (e.g. backtest.handler.ts) with boss.work() here.
logger.info('Worker started');

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Shutting down worker');
  try {
    await boss.stop({ graceful: true });
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to stop pg-boss');
    process.exit(1);
  }
}

process.once('SIGINT', (signal) => void shutdown(signal));
process.once('SIGTERM', (signal) => void shutdown(signal));
