/** Where users land after signing in when no action is pending (authentication.md). */
const DEFAULT_DESTINATION = '/realtime';

const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];

const DESTINATION_LABELS: Record<string, string> = {
  realtime: 'Realtime',
  strategy: 'Strategy Engine',
  library: 'Strategy library',
  discovery: 'Discovery',
  backtest: 'Backtest',
  news: 'News',
  settings: 'Settings',
};

/**
 * Returns `next` when it is a path inside this app, otherwise the default destination.
 * Rejects absolute and protocol-relative URLs so the parameter cannot become an open redirect.
 */
export function getSafeNext(next: string | null | undefined): string {
  if (!next?.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return DEFAULT_DESTINATION;
  }
  const base = 'http://app.invalid';
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return DEFAULT_DESTINATION;
  }
  if (url.origin !== base) return DEFAULT_DESTINATION;
  if (AUTH_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
    return DEFAULT_DESTINATION;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function destinationLabel(path: string): string {
  const segment = path.split(/[/?#]/)[1] ?? '';
  return DESTINATION_LABELS[segment] ?? 'Crypto Force';
}

/** Email carried between auth steps in navigation state, so switching steps keeps it. */
export function emailFromState(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'email' in state) {
    return typeof state.email === 'string' ? state.email : '';
  }
  return '';
}

/** True when the user switched auth tabs from the tab list, so the new tab should take focus. */
export function tabSwitchFromState(state: unknown): boolean {
  return (
    typeof state === 'object' && state !== null && 'focusTab' in state && state.focusTab === true
  );
}

/** Builds an auth URL that carries the pending destination, if any. */
export function authPath(path: string, next: string | null, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (next) params.set('next', getSafeNext(next));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
