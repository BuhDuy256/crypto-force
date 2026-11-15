import { apiEnvSchema } from '@crypto-force/shared';
import { z } from 'zod';

const parsed = apiEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
