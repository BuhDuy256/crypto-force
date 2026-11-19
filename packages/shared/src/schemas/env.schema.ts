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

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const apiEnvSchema = backendEnvSchema
  .extend({
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    /** Signs session cookies and verification tokens. Generate with `openssl rand -base64 32`. */
    BETTER_AUTH_SECRET: z.string().min(32),
    /** Public origin of the web app; auth links in emails and trusted origins derive from it. */
    BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
    RESEND_API_KEY: optionalString,
    /** Sender address on a domain verified in Resend, e.g. `Crypto Force <auth@example.com>`. */
    EMAIL_FROM: optionalString,
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && (!env.RESEND_API_KEY || !env.EMAIL_FROM)) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY and EMAIL_FROM are required in production.',
      });
    }
    if (Boolean(env.RESEND_API_KEY) !== Boolean(env.EMAIL_FROM)) {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_FROM'],
        message: 'Set RESEND_API_KEY and EMAIL_FROM together.',
      });
    }
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_SECRET'],
        message: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET together.',
      });
    }
  });

export const workerEnvSchema = backendEnvSchema;

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
