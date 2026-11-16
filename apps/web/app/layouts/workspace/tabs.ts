import { destinationLabel } from '~/utils/auth-redirect';

/** Main tabs of the App header, in display order (workspace.md, App header). */
export const WORKSPACE_TABS = ['/realtime', '/strategy', '/discovery', '/backtest', '/news'].map(
  (to) => ({ to, label: destinationLabel(to) }),
);
