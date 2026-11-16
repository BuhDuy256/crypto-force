import { PASSWORD_MIN_LENGTH, signUpSchema, type SignUpInput } from '@crypto-force/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { useSignUp } from '~/hooks/useAuth';
import { authPath } from '~/utils/auth-redirect';
import { ACCOUNT_PANEL_ID, AccountTabs, tabId } from './components/AccountTabs';
import { AuthField, PasswordField } from './components/AuthField';
import { ErrorSummary } from './components/ErrorSummary';
import { FormAlert } from './components/FormAlert';
import { GoogleButton } from './components/GoogleButton';
import { AuthHeading, NextNote } from './components/NextNote';

interface SignUpPageProps {
  googleEnabled: boolean;
  next: string | null;
  initialEmail: string;
}

export function SignUpPage({ googleEnabled, next, initialEmail }: SignUpPageProps) {
  const navigate = useNavigate();
  const signUp = useSignUp();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: initialEmail, password: '', acceptTerms: false },
  });
  const { errors, isSubmitted } = form.formState;
  const email = useWatch({ control: form.control, name: 'email' });

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      // The confirmation link signs the user in, then the sign-in route forwards to `next`.
      await signUp.mutateAsync({ input, callbackURL: authPath('/sign-in', next) });
      await navigate(authPath('/sign-up/verify', next), { state: { email: input.email } });
    } catch {
      // Shown below from `signUp.isError`.
    }
  });

  const summary = isSubmitted
    ? [
        errors.name && { field: 'name' as const, label: 'Full name', message: errors.name.message },
        errors.email && { field: 'email' as const, label: 'Email', message: errors.email.message },
        errors.password && {
          field: 'password' as const,
          label: 'Password',
          message: errors.password.message,
        },
        errors.acceptTerms && {
          field: 'acceptTerms' as const,
          label: 'Confirmation',
          message: errors.acceptTerms.message,
        },
      ]
    : [];

  return (
    <section aria-labelledby="auth-title" className="mx-auto flex w-full max-w-108 flex-col gap-6">
      <AuthHeading>Create your account</AuthHeading>
      <NextNote next={next} />
      <AccountTabs active="signup" next={next} email={email} />

      <div
        id={ACCOUNT_PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId('signup')}
        className="flex flex-col gap-6"
      >
        {googleEnabled && <GoogleButton next={next} returnedWithError={false} />}

        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
          <ErrorSummary
            errors={summary}
            onSelect={(field) => {
              form.setFocus(field);
            }}
          />
          <AuthField
            id="name"
            label="Full name"
            autoComplete="name"
            error={errors.name?.message}
            {...form.register('name')}
          />
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...form.register('email')}
          />
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            hint={`At least ${String(PASSWORD_MIN_LENGTH)} characters.`}
            error={errors.password?.message}
            {...form.register('password')}
          />
          <Controller
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3 py-1">
                  <Checkbox
                    id="accept-terms"
                    ref={field.ref}
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true);
                    }}
                    onBlur={field.onBlur}
                    aria-invalid={errors.acceptTerms ? true : undefined}
                    aria-describedby={errors.acceptTerms ? 'accept-terms-msg' : undefined}
                    className="mt-0.5 size-5"
                  />
                  {/* Terms and Privacy Policy pages are not defined yet (OQ-063). */}
                  <label htmlFor="accept-terms" className="cursor-pointer text-sm leading-normal">
                    I understand Crypto Force only simulates trades and never places real orders,
                    and I accept the Terms and Privacy Policy.
                  </label>
                </div>
                {errors.acceptTerms && (
                  <span id="accept-terms-msg" className="text-sm text-destructive">
                    {errors.acceptTerms.message}
                  </span>
                )}
              </div>
            )}
          />

          {signUp.isError && (
            <FormAlert tone="error" role="alert">
              We couldn’t create your account right now. Check your connection and try again.
            </FormAlert>
          )}

          <Button
            type="submit"
            disabled={signUp.isPending}
            className="h-12.5 rounded-lg text-base font-bold"
          >
            {signUp.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="m-0 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={authPath('/sign-in', next)}
            state={{ email }}
            className="font-semibold underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
