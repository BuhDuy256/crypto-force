import type { SignInInput, SignUpInput } from '@crypto-force/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  getSession,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOut,
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

/**
 * Signs out, drops account data cached in the browser and opens Landing (workspace.md, Sign out).
 * When the request fails the session may still be valid, so the user stays where they are.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      queryClient.clear();
      await navigate('/');
    },
    onError: () => {
      toast.error('Couldn’t sign out. Check your connection and try again.');
    },
  });
}

/** Reads the current session on demand, e.g. after the user confirmed their email elsewhere. */
export function useSessionCheck() {
  return useMutation({ mutationFn: () => getSession() });
}
