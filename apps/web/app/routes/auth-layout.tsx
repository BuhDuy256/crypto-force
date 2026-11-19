import { ArrowLeftIcon } from 'lucide-react';
import { Link, Outlet, redirect, useLoaderData, useRouteLoaderData } from 'react-router';
import { getAuthConfig, getSession } from '~/api/auth';
import { Logo } from '~/components/Logo';
import { VerifiedWhileSignedInPage } from '~/pages/Auth/VerifiedWhileSignedInPage';
import { getSafeNext } from '~/utils/auth-redirect';
import type { Route } from './+types/auth-layout';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const [session, config] = await Promise.all([
    getSession().catch(() => null),
    getAuthConfig().catch(() => ({ google: false })),
  ]);
  const next = getSafeNext(url.searchParams.get('next'));
  // A verification link of another account keeps the current session; Auth names both emails.
  const verified = url.searchParams.get('verified');
  if (session && verified && verified !== session.user.email) {
    return {
      googleEnabled: config.google,
      verifiedNotice: { verifiedEmail: verified, currentEmail: session.user.email, next },
    };
  }
  // A verification link that failed shows its error on Sign in, also when a session exists.
  const linkFailed =
    url.pathname === '/sign-in' &&
    url.searchParams.has('error') &&
    url.searchParams.get('provider') !== 'google';
  // Signed-in users skip Auth (OQ-054), except when they open a password reset link.
  if (session && url.pathname !== '/reset-password' && !linkFailed) {
    return redirect(next);
  }
  return { googleEnabled: config.google, verifiedNotice: null };
}

/** Auth configuration for the child routes of this layout. */
export function useAuthLayoutData() {
  const data = useRouteLoaderData<typeof clientLoader>('routes/auth-layout');
  return data ?? { googleEnabled: false };
}

export function meta(): Route.MetaDescriptors {
  return [{ name: 'robots', content: 'noindex' }];
}

export default function AuthLayout() {
  const { verifiedNotice } = useLoaderData<typeof clientLoader>();
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-page items-center gap-6 px-4 py-3 sm:px-7">
          <Logo />
          <Link
            to="/"
            className="ml-auto flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px] font-semibold text-foreground no-underline hover:bg-accent"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-page flex-1 flex-col px-4 pt-8 pb-16 sm:px-7 sm:pt-12 lg:justify-center"
      >
        {verifiedNotice ? <VerifiedWhileSignedInPage {...verifiedNotice} /> : <Outlet />}
      </main>
    </div>
  );
}
