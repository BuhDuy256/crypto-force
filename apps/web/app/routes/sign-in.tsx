import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { SignInPage } from '~/pages/Auth/SignInPage';
import { emailFromState } from '~/utils/auth-redirect';
import { takeEmailAfterGoogle } from '~/utils/google-email';
import { useAuthLayoutData } from './auth-layout';

export function meta() {
  return [{ title: 'Sign in – Crypto Force' }];
}

export default function SignInRoute() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { googleEnabled } = useAuthLayoutData();
  const returnedFromGoogle = searchParams.get('provider') === 'google';
  const [emailAfterGoogle] = useState(() => (returnedFromGoogle ? takeEmailAfterGoogle() : ''));

  return (
    <SignInPage
      // Remount when switching between tabs so the form picks up the carried email.
      key={location.key}
      googleEnabled={googleEnabled}
      next={searchParams.get('next')}
      initialEmail={emailFromState(location.state) || emailAfterGoogle}
      returnedError={searchParams.get('error')}
      returnedFromGoogle={returnedFromGoogle}
    />
  );
}
