import { ArrowLeftIcon } from 'lucide-react';
import { Link, Outlet, redirect, useRouteLoaderData } from 'react-router';
import { getAuthConfig, getSession } from '~/api/auth';
import { Logo } from '~/components/Logo';
import { getSafeNext } from '~/utils/auth-redirect';
import type { Route } from './+types/auth-layout';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const [session, config] = await Promise.all([
    getSession().catch(() => null),
    getAuthConfig().catch(() => ({ google: false })),
  ]);
  // Signed-in users skip Auth (OQ-054), except when they open a password reset link.
  if (session && url.pathname !== '/reset-password') {
    return redirect(getSafeNext(url.searchParams.get('next')));
  }
  return { googleEnabled: config.google };
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
        <Outlet />
      </main>
    </div>
  );
}
