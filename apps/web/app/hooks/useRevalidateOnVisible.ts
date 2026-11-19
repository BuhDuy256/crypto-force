import { useEffect } from 'react';
import { useRevalidator } from 'react-router';

/**
 * Re-runs the route loaders (and the session check in front of them) when the tab becomes visible
 * again, so a session ended in another tab or device shows the sign-in gate (workspace.md).
 */
export function useRevalidateOnVisible() {
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void revalidate();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [revalidate]);
}
