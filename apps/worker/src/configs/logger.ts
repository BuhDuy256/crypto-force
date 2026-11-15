import { pino } from 'pino';
import { env } from './env';

export const logger = pino({ name: 'worker', level: env.LOG_LEVEL });
