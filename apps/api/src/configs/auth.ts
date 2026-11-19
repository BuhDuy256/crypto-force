import { PASSWORD_MIN_LENGTH, type ApiEnv } from '@crypto-force/shared';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { and, eq, like } from 'drizzle-orm';
import type { Logger } from 'pino';
import type { Database } from '../database/client';
import * as schema from '../database/schema/index';
import { session as sessionTable, verification } from '../database/schema/index';
import type { AuthEmails } from '../services/auth-email.service';
import { isRejectedPassword } from '../services/password-check.service';

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
/** A session ends this long after sign-in, even when it is used every day (security.md, sessions). */
const SESSION_ABSOLUTE_LIMIT_MS = 30 * DAY * 1000;

/** Sign-in attempts allowed per IP address within the window (authentication.md, Sign in). */
/** Error text for a common or breached password (authentication.md, Create account). */
const PASSWORD_COMPROMISED_MESSAGE =
  'This password is too common or has appeared in a data breach. Choose a different one.';

const SIGN_IN_RATE_LIMIT = { window: 10, max: 3 };

/** The last accepted moment of a limit that ends at `end`. */
const endBefore = (end: Date) => new Date(end.getTime() - 1);

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
      // A new password makes every other reset link of the account invalid (BD-07a).
      onPasswordReset: async ({ user }) => {
        await db
          .delete(verification)
          .where(
            and(like(verification.identifier, 'reset-password:%'), eq(verification.value, user.id)),
          );
      },
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
    databaseHooks: {
      session: {
        update: {
          // The daily extension must not move the end of a session past its absolute limit.
          after: async (updated) => {
            const end = new Date(updated.createdAt.getTime() + SESSION_ABSOLUTE_LIMIT_MS);
            if (updated.expiresAt <= end) return;
            await db
              .update(sessionTable)
              .set({ expiresAt: end })
              .where(eq(sessionTable.id, updated.id));
          },
        },
      },
      verification: {
        // Better Auth accepts a reset link until `expiresAt < now`, so a request at exactly the
        // limit is accepted. The spec ends the link at the limit (authentication.md, Reset
        // password): store the end 1 ms earlier.
        create: {
          before: (data) =>
            Promise.resolve(
              data.identifier.startsWith('reset-password:')
                ? { data: { ...data, expiresAt: endBefore(data.expiresAt) } }
                : undefined,
            ),
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      customRules: { '/sign-in/email': SIGN_IN_RATE_LIMIT },
    },
    hooks: {
      // Create account and Reset password reject common and breached passwords.
      before: createAuthMiddleware(async (ctx) => {
        // Better Auth accepts a session until `expiresAt < now`; the spec ends it at `expiresAt`
        // (security.md, sessions). Remove a session that has reached its end before the request.
        const { name } = ctx.context.authCookies.sessionToken;
        const token = await ctx.getSignedCookie(name, ctx.context.secret);
        if (token) {
          const current = await ctx.context.internalAdapter.findSession(token);
          if (current && current.session.expiresAt.getTime() <= Date.now()) {
            await ctx.context.internalAdapter.deleteSession(token);
          }
        }

        const body = ctx.body as { password?: unknown; newPassword?: unknown } | undefined;
        const password =
          ctx.path === '/sign-up/email'
            ? body?.password
            : ctx.path === '/reset-password'
              ? body?.newPassword
              : undefined;
        if (typeof password !== 'string') return;
        if (await isRejectedPassword(password, logger)) {
          throw new APIError('BAD_REQUEST', {
            code: 'PASSWORD_COMPROMISED',
            message: PASSWORD_COMPROMISED_MESSAGE,
          });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        const newSession = ctx.context.newSession;
        if (!newSession) return;
        const { name } = ctx.context.authCookies.sessionToken;
        const oldToken = await ctx.getSignedCookie(name, ctx.context.secret);
        if (!oldToken || oldToken === newSession.session.token) return;

        // Signing in again must revoke the session that the request still carries (ASVS 7.2.4).
        if (ctx.path === '/sign-in/email') {
          await ctx.context.internalAdapter.deleteSession(oldToken);
          return;
        }

        // A verification link opened while another account is signed in keeps that session
        // (authentication.md, Create account step 4). The Auth screen names both emails.
        if (ctx.path === '/verify-email') {
          const current = await ctx.context.internalAdapter.findSession(oldToken);
          if (!current || current.session.expiresAt <= new Date()) return;
          if (current.user.id === newSession.user.id) return;
          await ctx.context.internalAdapter.deleteSession(newSession.session.token);
          await setSessionCookie(ctx, current);
          const callback = typeof ctx.query?.callbackURL === 'string' ? ctx.query.callbackURL : '/';
          const target = new URL(callback, env.BETTER_AUTH_URL);
          target.searchParams.set('verified', newSession.user.email);
          throw ctx.redirect(`${target.pathname}${target.search}`);
        }
      }),
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
