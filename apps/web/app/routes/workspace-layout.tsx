import { Outlet, createContext, data } from 'react-router';
import { getSession, type Session } from '~/api/auth';
import { useRevalidateOnVisible } from '~/hooks/useRevalidateOnVisible';
import { AppHeader } from '~/layouts/workspace/AppHeader';
import type { Route } from './+types/workspace-layout';

const sessionContext = createContext<Session>();

/**
 * Runs before any loader of a workspace screen, so no screen loads data without a session.
 * The thrown statuses are rendered by the root ErrorBoundary: React Router picks the root boundary
 * on the first page load and this layout's position on client navigation, so the layout has no
 * boundary of its own to keep both cases identical.
 */
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  async ({ context }) => {
    const session = await getSession().catch(() => {
      throw data(null, { status: 503 });
    });
    if (!session) throw data(null, { status: 401 });
    context.set(sessionContext, session);
  },
];

export function clientLoader({ context }: Route.ClientLoaderArgs) {
  return { user: context.get(sessionContext).user };
}

export function meta(): Route.MetaDescriptors {
  return [{ name: 'robots', content: 'noindex' }];
}

export default function WorkspaceLayout({ loaderData }: Route.ComponentProps) {
  useRevalidateOnVisible();

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader user={loaderData.user} />
      <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
