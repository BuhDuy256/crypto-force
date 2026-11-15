import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

const logLevelSchema = z
  .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  .default('info');

/** Environment variables shared by every backend process (API and Worker). */
export const backendEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  LOG_LEVEL: logLevelSchema,
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export const apiEnvSchema = backendEnvSchema.extend({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export const workerEnvSchema = backendEnvSchema;

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
