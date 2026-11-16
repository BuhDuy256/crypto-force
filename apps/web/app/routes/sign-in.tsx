import { useLocation, useSearchParams } from 'react-router';
import { SignInPage } from '~/pages/Auth/SignInPage';
import { emailFromState } from '~/utils/auth-redirect';
import { useAuthLayoutData } from './auth-layout';

export function meta() {
  return [{ title: 'Sign in – Crypto Force' }];
}

export default function SignInRoute() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { googleEnabled } = useAuthLayoutData();

  return (
    <SignInPage
      // Remount when switching between tabs so the form picks up the carried email.
      key={location.key}
      googleEnabled={googleEnabled}
      next={searchParams.get('next')}
      initialEmail={emailFromState(location.state)}
      returnedError={searchParams.get('error')}
      returnedFromGoogle={searchParams.get('provider') === 'google'}
    />
  );
}
