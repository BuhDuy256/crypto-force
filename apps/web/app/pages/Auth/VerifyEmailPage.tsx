import { useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { useResendVerification, useSessionCheck } from '~/hooks/useAuth';
import { authPath, destinationLabel, getSafeNext } from '~/utils/auth-redirect';
import { FormAlert, TextButton } from './components/FormAlert';
import { AuthHeading, NextNote } from './components/NextNote';

interface VerifyEmailPageProps {
  email: string;
  next: string | null;
}

export function VerifyEmailPage({ email, next }: VerifyEmailPageProps) {
  const navigate = useNavigate();
  const resend = useResendVerification();
  const sessionCheck = useSessionCheck();
  const destination = getSafeNext(next);

  const continueAfterConfirming = async () => {
    const session = await sessionCheck.mutateAsync().catch(() => null);
    if (session) {
      await navigate(destination, { replace: true });
      return;
    }
    // Confirmed on another device (or not yet): this browser has no session, so sign in here.
    await navigate(authPath('/sign-in', next), { replace: true, state: { email } });
  };

  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-4">
      <AuthHeading>Check your email</AuthHeading>
      <p className="m-0 text-base leading-relaxed text-muted-foreground">
        We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open it
        to activate your account. The link expires in 1 hour.
      </p>
      <NextNote next={next} />
      <Button
        type="button"
        disabled={sessionCheck.isPending}
        onClick={() => void continueAfterConfirming()}
        className="h-12.5 rounded-lg text-base font-semibold"
      >
        I’ve confirmed, continue to {destinationLabel(destination)}
      </Button>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span>Didn’t get it? Check spam, or</span>
        <TextButton
          disabled={resend.isPending || resend.isSuccess}
          onClick={() => {
            resend.mutate({ email, callbackURL: authPath('/sign-in', next) });
          }}
          className="font-normal"
        >
          {resend.isSuccess ? 'Sent again' : 'resend the link'}
        </TextButton>
        <TextButton
          onClick={() => {
            void navigate(authPath('/sign-up', next), { state: { email } });
          }}
          className="font-normal"
        >
          Use a different email
        </TextButton>
      </div>
      {resend.isError && (
        <FormAlert tone="error" role="alert">
          We couldn’t send a new link. Wait a minute and try again.
        </FormAlert>
      )}
    </section>
  );
}
