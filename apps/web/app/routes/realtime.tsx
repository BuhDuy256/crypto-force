import { Link, redirect } from 'react-router';
import { getSession } from '~/api/auth';
import { Logo } from '~/components/Logo';
import { authPath } from '~/utils/auth-redirect';
import type { Route } from './+types/realtime';

// Temporary landing page after sign-in until the Realtime screen and the app shell exist.
export async function clientLoader() {
  const session = await getSession().catch(() => null);
  if (!session) return redirect(authPath('/sign-in', '/realtime'));
  return { user: session.user };
}

export function meta(): Route.MetaDescriptors {
  return [{ title: 'Realtime – Crypto Force' }, { name: 'robots', content: 'noindex' }];
}

export default function RealtimeRoute({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-page items-center gap-6 px-4 py-3 sm:px-7">
          <Logo />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-page flex-col gap-3 px-4 py-10 sm:px-7"
      >
        <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em]">Realtime</h1>
        <p className="m-0 text-muted-foreground">
          Signed in as <strong className="text-foreground">{user.name}</strong> ({user.email}). This
          screen is not built yet.
        </p>
        <Link to="/" className="self-start font-semibold">
          Back to home
        </Link>
      </main>
    </div>
  );
}
