import { useEffect, useRef } from 'react';

/**
 * A Retry button leaves the DOM after a successful retry, and the browser then moves focus to the
 * body. When the button had focus, move focus to `containerRef` so keyboard users stay in the
 * same chart or sidebar (docs/UCs/market-data.md, MK-46, MK-48).
 */
export function useRetryFocus<T extends HTMLElement>(showRetry: boolean) {
  const containerRef = useRef<T>(null);
  const retryHadFocus = useRef(false);
  useEffect(() => {
    const focusLost = document.activeElement === null || document.activeElement === document.body;
    if (!showRetry && retryHadFocus.current && focusLost) containerRef.current?.focus();
    retryHadFocus.current = false;
  }, [showRetry]);
  return {
    containerRef,
    /** Call from the Retry click handler with the button that received the click. */
    onRetry: (button: HTMLElement) => {
      retryHadFocus.current = document.activeElement === button;
    },
  };
}
