import { signInSchema, type SignInInput } from '@crypto-force/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { AuthRequestError, useResendVerification, useSignIn } from '~/hooks/useAuth';
import { authPath, getSafeNext } from '~/utils/auth-redirect';
import { ACCOUNT_PANEL_ID, AccountTabs, tabId } from './components/AccountTabs';
import { AuthField, PasswordField } from './components/AuthField';
import { ErrorSummary } from './components/ErrorSummary';
import { FormAlert, TextButton } from './components/FormAlert';
import { GoogleButton } from './components/GoogleButton';
import { AuthHeading, NextNote } from './components/NextNote';

type SignInProblem =
  | { kind: 'credentials' }
  | { kind: 'locked' }
  | { kind: 'unverified'; email: string }
  | { kind: 'unavailable' };

const LINK_ERRORS: Record<string, string> = {
  TOKEN_EXPIRED: 'This confirmation link has expired. Enter your email and send a new link.',
  INVALID_TOKEN:
    'This confirmation link is invalid or was already used. Enter your email and send a new link.',
};

interface SignInPageProps {
  googleEnabled: boolean;
  next: string | null;
  initialEmail: string;
  /** Error code from a confirmation link or from Google, passed back in the URL. */
  returnedError: string | null;
  returnedFromGoogle: boolean;
}

function toProblem(error: unknown, email: string): SignInProblem {
  if (!(error instanceof AuthRequestError)) return { kind: 'unavailable' };
  if (error.status === 429) return { kind: 'locked' };
  if (error.code === 'EMAIL_NOT_VERIFIED') return { kind: 'unverified', email };
  if (error.status === 401) return { kind: 'credentials' };
  return { kind: 'unavailable' };
}

export function SignInPage({
  googleEnabled,
  next,
  initialEmail,
  returnedError,
  returnedFromGoogle,
}: SignInPageProps) {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const resend = useResendVerification();
  const [problem, setProblem] = useState<SignInProblem | null>(null);
  const destination = getSafeNext(next);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: initialEmail, password: '', rememberMe: true },
  });
  const { errors, isSubmitted } = form.formState;
  const email = useWatch({ control: form.control, name: 'email' });

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await signIn.mutateAsync({ input, callbackURL: destination });
      await navigate(destination, { replace: true });
    } catch (error) {
      setProblem(toProblem(error, input.email));
    }
  });

  const summary = isSubmitted
    ? [
        errors.email && { field: 'email' as const, label: 'Email', message: errors.email.message },
        errors.password && {
          field: 'password' as const,
          label: 'Password',
          message: errors.password.message,
        },
      ]
    : [];

  // Register in visual order: React Hook Form focuses the first registered invalid field.
  const emailField = form.register('email');
  const passwordField = form.register('password', {
    onChange: () => {
      // Editing the password hides a wrong-password error, but never the lock message.
      if (problem?.kind === 'credentials') setProblem(null);
    },
  });

  const linkError = !returnedFromGoogle && returnedError ? LINK_ERRORS[returnedError] : undefined;

  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-6">
      <AuthHeading>Welcome back</AuthHeading>
      <NextNote next={next} />
      {linkError && (
        <FormAlert tone="error" role="alert">
          {linkError}
          <TextButton
            disabled={resend.isPending || resend.isSuccess}
            onClick={() => {
              void form.trigger('email').then((valid) => {
                if (!valid) {
                  form.setFocus('email');
                  return;
                }
                resend.mutate({ email, callbackURL: authPath('/sign-in', next) });
              });
            }}
          >
            {resend.isSuccess ? 'Sent again' : 'Send a new link'}
          </TextButton>
        </FormAlert>
      )}
      <AccountTabs active="signin" next={next} email={email} />

      <div
        id={ACCOUNT_PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId('signin')}
        className="flex flex-col gap-6"
      >
        {googleEnabled && (
          <GoogleButton
            next={next}
            returnedWithError={returnedFromGoogle}
            returnedErrorCode={returnedError}
            email={email}
          />
        )}

        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
          <ErrorSummary
            errors={summary}
            onSelect={(field) => {
              form.setFocus(field);
            }}
          />
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...emailField}
          />
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            labelAction={
              <Link
                to={authPath('/forgot-password', next)}
                state={{ email }}
                className="text-sm underline"
              >
                Forgot password?
              </Link>
            }
            {...passwordField}
          />
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex min-h-8 items-center gap-3">
                <Checkbox
                  id="remember-me"
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                  }}
                  className="size-5"
                />
                <label htmlFor="remember-me" className="cursor-pointer text-sm">
                  Keep me signed in on this device
                </label>
              </div>
            )}
          />

          {problem?.kind === 'credentials' && (
            <FormAlert tone="error" role="alert">
              That email and password don’t match. Check for typos, or reset your password.
              <Link
                to={authPath('/forgot-password', next)}
                state={{ email }}
                className="font-semibold underline"
              >
                Reset password
              </Link>
            </FormAlert>
          )}
          {problem?.kind === 'locked' && (
            <FormAlert tone="error" role="alert">
              Too many attempts. Wait a few minutes and try again, or reset your password.
              <Link
                to={authPath('/forgot-password', next)}
                state={{ email }}
                className="font-semibold underline"
              >
                Reset password
              </Link>
            </FormAlert>
          )}
          {problem?.kind === 'unverified' && (
            <FormAlert tone="error" role="alert">
              Confirm your email first. Open the link we sent to {problem.email}.
              <TextButton
                disabled={resend.isPending || resend.isSuccess}
                onClick={() => {
                  resend.mutate({
                    email: problem.email,
                    callbackURL: authPath('/sign-in', next),
                  });
                }}
              >
                {resend.isSuccess ? 'Sent again' : 'Resend the link'}
              </TextButton>
            </FormAlert>
          )}
          {problem?.kind === 'unavailable' && (
            <FormAlert tone="error" role="alert">
              We couldn’t sign you in right now. Check your connection and try again.
            </FormAlert>
          )}

          <Button
            type="submit"
            disabled={signIn.isPending}
            className="h-12.5 rounded-lg text-base font-bold"
          >
            {signIn.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="m-0 text-sm text-muted-foreground">
          New to Crypto Force?{' '}
          <Link
            to={authPath('/sign-up', next)}
            state={{ email }}
            className="font-semibold underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
