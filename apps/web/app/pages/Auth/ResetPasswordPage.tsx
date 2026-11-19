import {
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@crypto-force/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { AuthRequestError, useResetPassword } from '~/hooks/useAuth';
import { authPath } from '~/utils/auth-redirect';
import { PasswordField } from './components/AuthField';
import { ErrorSummary } from './components/ErrorSummary';
import { FormAlert } from './components/FormAlert';
import { AuthHeading } from './components/NextNote';

const linkButtonClass =
  'flex h-12.5 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground no-underline hover:bg-primary/90';

function ExpiredLink() {
  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-4">
      <AuthHeading>This link has expired</AuthHeading>
      <FormAlert tone="error" role="alert">
        This reset link has expired or was already used. Request a new link to choose a password.
      </FormAlert>
      <Link to="/forgot-password" className={linkButtonClass}>
        Send a new link
      </Link>
      <Link to="/sign-in" className="min-h-10 self-start text-sm font-semibold underline">
        Back to sign in
      </Link>
    </section>
  );
}

/** `token` comes from the reset link; `null` means the link was invalid or expired. */
export function ResetPasswordPage({ token, next }: { token: string | null; next: string | null }) {
  const reset = useResetPassword();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const { errors, isSubmitted } = form.formState;

  const tokenRejected =
    reset.error instanceof AuthRequestError && reset.error.code === 'INVALID_TOKEN';
  if (!token || tokenRejected) return <ExpiredLink />;

  if (reset.isSuccess) {
    return (
      <section
        aria-labelledby="auth-title"
        className="mx-auto flex w-full max-w-108 flex-col gap-4"
      >
        <AuthHeading>Choose a new password</AuthHeading>
        <FormAlert tone="success" role="status">
          Password updated. You’ve been signed out on every device; sign in with your new password.
        </FormAlert>
        <Link to={authPath('/sign-in', next)} className={linkButtonClass}>
          Sign in
        </Link>
      </section>
    );
  }

  const onSubmit = form.handleSubmit((input) => {
    reset.mutate({ token, newPassword: input.newPassword });
  });

  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-4">
      <AuthHeading>Choose a new password</AuthHeading>
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
        <ErrorSummary
          errors={
            isSubmitted
              ? [
                  errors.newPassword && {
                    field: 'newPassword' as const,
                    label: 'New password',
                    message: errors.newPassword.message,
                  },
                  errors.confirmPassword && {
                    field: 'confirmPassword' as const,
                    label: 'Confirm new password',
                    message: errors.confirmPassword.message,
                  },
                ]
              : []
          }
          onSelect={(field) => {
            form.setFocus(field);
          }}
        />
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          hint={`At least ${String(PASSWORD_MIN_LENGTH)} characters.`}
          error={errors.newPassword?.message}
          {...form.register('newPassword', {
            onChange: () => {
              if (form.getValues('confirmPassword')) void form.trigger('confirmPassword');
            },
          })}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
        {reset.isError && (
          <FormAlert tone="error" role="alert">
            {reset.error instanceof AuthRequestError && reset.error.code === 'PASSWORD_COMPROMISED'
              ? reset.error.message
              : 'We couldn’t save your new password right now. Try again.'}
          </FormAlert>
        )}
        <Button
          type="submit"
          disabled={reset.isPending}
          className="h-12.5 rounded-lg text-base font-semibold"
        >
          {reset.isPending ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </section>
  );
}
