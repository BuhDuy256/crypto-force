import { PASSWORD_MIN_LENGTH, type ApiEnv } from '@crypto-force/shared';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Logger } from 'pino';
import type { Database } from '../database/client';
import * as schema from '../database/schema/index';
import type { AuthEmails } from '../services/auth-email.service';

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/** Sign-in attempts allowed per IP address within the window (authentication.md, Sign in). */
const SIGN_IN_RATE_LIMIT = { window: 15 * 60, max: 5 };

type AuthEnv = Pick<
  ApiEnv,
  | 'NODE_ENV'
  | 'BETTER_AUTH_SECRET'
  | 'BETTER_AUTH_URL'
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
>;

interface AuthDependencies {
  env: AuthEnv;
  db: Database;
  emails: AuthEmails;
  logger: Logger;
}

export function isGoogleEnabled(env: AuthEnv) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function createAuth({ env, db, emails, logger }: AuthDependencies) {
  // Emails are sent without awaiting so response time does not reveal whether an account exists.
  const sendInBackground = (send: Promise<void>, subject: string) => {
    send.catch((error: unknown) => {
      logger.error({ err: error, subject }, 'Failed to send auth email');
    });
  };

  return betterAuth({
    appName: 'Crypto Force',
    // The web app proxies /api to this server, so auth runs on the web origin.
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      resetPasswordTokenExpiresIn: HOUR,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) => {
        sendInBackground(emails.sendPasswordReset(user.email, url), 'password-reset');
        return Promise.resolve();
      },
      onExistingUserSignUp: ({ user }) => {
        sendInBackground(emails.sendExistingAccount(user.email), 'existing-account');
        return Promise.resolve();
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      // The Auth screen offers an explicit "resend" action instead.
      sendOnSignIn: false,
      autoSignInAfterVerification: true,
      expiresIn: HOUR,
      sendVerificationEmail: ({ user, url }) => {
        sendInBackground(emails.sendVerification(user.email, url), 'verification');
        return Promise.resolve();
      },
    },
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {},
    // "Keep me signed in" on: 7 days, extended daily while in use. Off: browser-session cookie.
    session: { expiresIn: 7 * DAY, updateAge: DAY },
    rateLimit: {
      enabled: true,
      storage: 'database',
      customRules: { '/sign-in/email': SIGN_IN_RATE_LIMIT },
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === 'production',
      // Better Auth skips origin and callback URL checks when NODE_ENV=test; keep them on everywhere.
      disableOriginCheck: false,
    },
    telemetry: { enabled: false },
    logger: {
      level: 'warn',
      log: (level, message, ...args) => {
        logger[level]({ args }, `[better-auth] ${message}`);
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
