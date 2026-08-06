'use client';

import { useSyncExternalStore } from 'react';

/**
 * A media query as an external store.
 *
 * `useSyncExternalStore` rather than useState+useEffect: matchMedia IS an
 * external store, and this gets the server snapshot right instead of rendering
 * one value and correcting it after hydration.
 *
 * The server cannot know the viewport, so `getServerSnapshot` returns false.
 * Only use this for values that affect MOTION, never layout — layout must come
 * from CSS media queries, which are correct on the first paint.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Matches the `width < 48rem` breakpoint the pinned sequence uses in CSS. */
export const MOBILE_QUERY = '(max-width: 47.999rem)';

export function useIsMobileViewport(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
