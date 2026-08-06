'use client';

import { useSyncExternalStore } from 'react';

/**
 * Live `prefers-reduced-motion`.
 *
 * The tier is resolved once before paint, which is what prevents a flash of
 * animated content. This hook covers the narrower case of the user changing
 * the OS setting while the page is open — the tier attribute is not
 * re-evaluated after load.
 *
 * `useSyncExternalStore` rather than useState+useEffect: matchMedia IS an
 * external store, and this gets the server snapshot right instead of rendering
 * one value and correcting it after hydration.
 */
const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** The server cannot know. `false` matches the tier default of `full`. */
function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
