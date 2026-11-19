import { useLocation, useSearchParams } from 'react-router';
import { SignUpPage } from '~/pages/Auth/SignUpPage';
import { emailFromState } from '~/utils/auth-redirect';
import { useAuthLayoutData } from './auth-layout';

export function meta() {
  return [{ title: 'Create account – Crypto Force' }];
}

export default function SignUpRoute() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { googleEnabled } = useAuthLayoutData();

  return (
    <SignUpPage
      key={location.key}
      googleEnabled={googleEnabled}
      next={searchParams.get('next')}
      initialEmail={emailFromState(location.state)}
    />
  );
}
