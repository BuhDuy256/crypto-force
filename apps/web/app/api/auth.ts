import {
  authConfigSchema,
  type AuthConfig,
  type SignInInput,
  type SignUpInput,
} from '@crypto-force/shared';
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({ basePath: '/api/auth' });

/** Error returned by the auth server; `code` is Better Auth's error code when present. */
export class AuthRequestError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  /** Seconds until a rate-limited request may be retried. */
  readonly retryAfter: number | undefined;

  constructor(status: number, code: string | undefined, message: string, retryAfter?: number) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

interface BetterFetchError {
  status: number;
  statusText: string;
  code?: string | undefined;
  message?: string | undefined;
}

type AuthResult<T> = { data: T; error: null } | { data: null; error: BetterFetchError };

async function unwrap<T>(request: Promise<AuthResult<T>>, retryAfter?: () => number | undefined) {
  const result = await request;
  if (result.error) {
    const { status, statusText, code, message } = result.error;
    throw new AuthRequestError(status, code, message ?? statusText, retryAfter?.());
  }
  return result.data;
}

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function getSession() {
  return unwrap(authClient.getSession());
}

/** Revokes the session on the server and clears the session cookie. */
export async function signOut() {
  return unwrap(authClient.signOut());
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const response = await fetch('/api/auth-config');
  if (!response.ok) throw new AuthRequestError(response.status, undefined, response.statusText);
  return authConfigSchema.parse(await response.json());
}

export async function signInWithEmail(input: SignInInput, callbackURL: string) {
  let retryAfter: number | undefined;
  return unwrap(
    authClient.signIn.email(
      { ...input, callbackURL },
      {
        onError: ({ response }) => {
          const header = response.headers.get('x-retry-after');
          retryAfter = header ? Number(header) : undefined;
        },
      },
    ),
    () => retryAfter,
  );
}

/** `callbackURL` is where the verification link lands after confirming the email. */
export async function signUpWithEmail({ name, email, password }: SignUpInput, callbackURL: string) {
  return unwrap(authClient.signUp.email({ name, email, password, callbackURL }));
}

export async function resendVerificationEmail(email: string, callbackURL: string) {
  return unwrap(authClient.sendVerificationEmail({ email, callbackURL }));
}

export async function requestPasswordReset(email: string) {
  return unwrap(authClient.requestPasswordReset({ email, redirectTo: '/reset-password' }));
}

export async function resetPassword(token: string, newPassword: string) {
  return unwrap(authClient.resetPassword({ token, newPassword }));
}

/** Leaves the app for Google; the browser comes back to `callbackURL` or `errorCallbackURL`. */
export async function signInWithGoogle(callbackURL: string, errorCallbackURL: string) {
  return unwrap(authClient.signIn.social({ provider: 'google', callbackURL, errorCallbackURL }));
}
