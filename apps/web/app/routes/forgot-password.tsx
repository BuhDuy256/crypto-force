import { useLocation, useSearchParams } from 'react-router';
import { ForgotPasswordPage } from '~/pages/Auth/ForgotPasswordPage';
import { emailFromState } from '~/utils/auth-redirect';

export function meta() {
  return [{ title: 'Reset password – Crypto Force' }];
}

export default function ForgotPasswordRoute() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  return (
    <ForgotPasswordPage
      key={location.key}
      next={searchParams.get('next')}
      initialEmail={emailFromState(location.state)}
    />
  );
}
