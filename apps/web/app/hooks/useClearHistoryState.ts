import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Removes the state of the current history entry after the first render. The browser keeps
 * history state on reload; call this when a reload must not see the state again.
 */
export function useClearHistoryState() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasState = location.state !== null;

  useEffect(() => {
    if (hasState) {
      void navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [hasState, location.pathname, location.search, navigate]);
}
