import { useSearchParams } from 'react-router';
import { ResetPasswordPage } from '~/pages/Auth/ResetPasswordPage';

export function meta() {
  return [
    { title: 'Choose a new password – Crypto Force' },
    // The URL holds the reset token; never send it in a Referer header.
    { name: 'referrer', content: 'no-referrer' },
  ];
}

export default function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  // The auth server redirects here with `?token=` for a valid link, or `?error=` otherwise.
  const token = searchParams.get('error') ? null : searchParams.get('token');
  return <ResetPasswordPage token={token} next={searchParams.get('next')} />;
}
