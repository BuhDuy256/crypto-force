import type { SignInInput, SignUpInput } from '@crypto-force/shared';
import { useMutation } from '@tanstack/react-query';
import {
  getSession,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '~/api/auth';

export { AuthRequestError } from '~/api/auth';

export function useSignIn() {
  return useMutation({
    mutationFn: ({ input, callbackURL }: { input: SignInInput; callbackURL: string }) =>
      signInWithEmail(input, callbackURL),
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: ({ input, callbackURL }: { input: SignUpInput; callbackURL: string }) =>
      signUpWithEmail(input, callbackURL),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: ({ email, callbackURL }: { email: string; callbackURL: string }) =>
      resendVerificationEmail(email, callbackURL),
  });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email: string) => requestPasswordReset(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      resetPassword(token, newPassword),
  });
}

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: ({
      callbackURL,
      errorCallbackURL,
    }: {
      callbackURL: string;
      errorCallbackURL: string;
    }) => signInWithGoogle(callbackURL, errorCallbackURL),
  });
}

/** Reads the current session on demand, e.g. after the user confirmed their email elsewhere. */
export function useSessionCheck() {
  return useMutation({ mutationFn: () => getSession() });
}
