import { forgotPasswordSchema, type ForgotPasswordInput } from '@crypto-force/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { useRequestPasswordReset } from '~/hooks/useAuth';
import { authPath } from '~/utils/auth-redirect';
import { AuthField } from './components/AuthField';
import { FormAlert } from './components/FormAlert';
import { AuthHeading } from './components/NextNote';

interface ForgotPasswordPageProps {
  next: string | null;
  initialEmail: string;
}

export function ForgotPasswordPage({ next, initialEmail }: ForgotPasswordPageProps) {
  const request = useRequestPasswordReset();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail },
  });
  const email = useWatch({ control: form.control, name: 'email' });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((input) => {
    request.mutate(input.email);
  });

  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-5">
      <Link
        to={authPath('/sign-in', next)}
        state={{ email }}
        className="flex min-h-10 items-center gap-2 self-start text-sm font-semibold text-foreground no-underline"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
      <AuthHeading>Reset your password</AuthHeading>

      {request.isSuccess ? (
        <FormAlert tone="success" role="status">
          <span>
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Follow
            the instructions in the email to reset your password. The link expires in 1 hour.
          </span>
        </FormAlert>
      ) : (
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-5">
          <p className="m-0 text-base leading-normal text-muted-foreground">
            Enter the email you signed up with and we’ll send a link to choose a new password.
          </p>
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...form.register('email')}
          />
          {request.isError && (
            <FormAlert tone="error" role="alert">
              We couldn’t send the link right now. Wait a minute and try again.
            </FormAlert>
          )}
          <Button
            type="submit"
            disabled={request.isPending}
            className="h-12.5 rounded-lg text-base font-bold"
          >
            {request.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </section>
  );
}
