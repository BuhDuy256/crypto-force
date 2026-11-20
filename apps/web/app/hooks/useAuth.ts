import type { SignInInput, SignUpInput } from '@crypto-force/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: ({ email, redirectTo }: { email: string; redirectTo: string }) =>
      requestPasswordReset(email, redirectTo),
  });
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
 * Signs out, drops account data cached in the browser and opens Landing (docs/UCs/authentication.md, SS-01).
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

/**
 * Whether the browser has a session, for public pages that change their calls to action.
 * Not cached across pages, so signing in or out elsewhere shows up on the next visit.
 * While loading, or when the check fails, the page renders as signed out.
 */
export function useIsSignedIn() {
  const { data } = useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  return data != null;
}

/** Reads the current session on demand, e.g. after the user confirmed their email elsewhere. */
export function useSessionCheck() {
  return useMutation({ mutationFn: () => getSession() });
}
