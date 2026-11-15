import { pino } from 'pino';
import { env } from './env';

export const logger = pino({
  name: 'api',
  level: env.LOG_LEVEL,
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
});
