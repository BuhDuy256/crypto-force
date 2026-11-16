import { createApp } from './app';
import { createAuth, isGoogleEnabled } from './configs/auth';
import { env } from './configs/env';
import { logger } from './configs/logger';
import { createDatabase } from './database/client';
import { createAuthEmails } from './services/auth-email.service';
import { createMailer } from './services/mailer';

const { db, pool } = createDatabase(env.DATABASE_URL);
const mailer = createMailer(
  { nodeEnv: env.NODE_ENV, resendApiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM },
  logger,
);
const auth = createAuth({
  env,
  db,
  emails: createAuthEmails(mailer, env.BETTER_AUTH_URL),
  logger,
});
const app = createApp({ logger, auth, authConfig: { google: isGoogleEnabled(env) } });

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
