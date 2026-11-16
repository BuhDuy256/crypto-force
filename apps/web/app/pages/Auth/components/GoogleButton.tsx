import { Loader2Icon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useGoogleSignIn } from '~/hooks/useAuth';
import { authPath, getSafeNext } from '~/utils/auth-redirect';
import { FormAlert } from './FormAlert';

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

interface GoogleButtonProps {
  next: string | null;
  /** Google redirected back with an error. */
  returnedWithError: boolean;
}

export function GoogleButton({ next, returnedWithError }: GoogleButtonProps) {
  const google = useGoogleSignIn();
  // A successful call navigates away, so `isSuccess` also means "waiting for Google".
  const waiting = google.isPending || google.isSuccess;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={waiting}
        aria-busy={waiting}
        onClick={() => {
          google.mutate({
            callbackURL: getSafeNext(next),
            errorCallbackURL: authPath('/sign-in', next, { provider: 'google' }),
          });
        }}
        className="h-12.5 gap-3 rounded-lg bg-muted text-base font-semibold dark:bg-muted dark:hover:bg-accent"
      >
        {waiting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <GoogleMark />}
        {waiting ? 'Waiting for Google…' : 'Continue with Google'}
      </Button>
      {(returnedWithError || google.isError) && (
        <FormAlert tone="error" role="alert">
          Google sign-in didn’t finish. It may have been cancelled or blocked. Try again, or use
          your email below.
        </FormAlert>
      )}
      <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
        <span className="flex-1 border-t" />
        or with email
        <span className="flex-1 border-t" />
      </div>
    </>
  );
}
