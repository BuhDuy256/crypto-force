import { useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { useClearHistoryState } from '~/hooks/useClearHistoryState';
import { VerifyEmailPage } from '~/pages/Auth/VerifyEmailPage';
import { authPath, emailFromState } from '~/utils/auth-redirect';

export function meta() {
  return [{ title: 'Check your email – Crypto Force' }];
}

export default function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Read the email once, then remove it from the history entry: the browser keeps history state
  // on reload, and a reload must return to Create account (docs/UCs/authentication.md, CA-15).
  const [email] = useState(() => emailFromState(location.state));
  const next = searchParams.get('next');
  useClearHistoryState();

  // The email only arrives from the Create account form; without it there is nothing to confirm.
  if (!email) return <Navigate to={authPath('/sign-up', next)} replace />;

  return <VerifyEmailPage email={email} next={next} />;
}
