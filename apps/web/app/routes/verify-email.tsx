import { Navigate, useLocation, useSearchParams } from 'react-router';
import { VerifyEmailPage } from '~/pages/Auth/VerifyEmailPage';
import { authPath, emailFromState } from '~/utils/auth-redirect';

export function meta() {
  return [{ title: 'Check your email – Crypto Force' }];
}

export default function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const email = emailFromState(location.state);
  const next = searchParams.get('next');

  // The email only arrives from the Create account form; without it there is nothing to confirm.
  if (!email) return <Navigate to={authPath('/sign-up', next)} replace />;

  return <VerifyEmailPage email={email} next={next} />;
}
