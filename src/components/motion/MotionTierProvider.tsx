'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

import {
  MotionTierContext,
  isMotionTier,
  type MotionTier,
} from '@/hooks/use-motion-tier';

/**
 * Reads the tier the inline script resolved before first paint and provides it
 * to the tree.
 *
 * `useSyncExternalStore` rather than useState+useEffect: the tier lives on
 * <html data-motion-tier>, which is an external store. The server snapshot is
 * `full`, matching the documented default — absent detection APIs must not
 * degrade Safari and Firefox.
 *
 * `value` forces a tier. That exists for the dev review surface, which shows
 * all three side by side; it is not a runtime feature.
 */
const noop = () => () => {};

function getTierSnapshot(): MotionTier {
  const resolved = document.documentElement.dataset.motionTier;
  return isMotionTier(resolved) ? resolved : 'full';
}

function getServerTierSnapshot(): MotionTier {
  return 'full';
}

export function MotionTierProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: MotionTier;
}) {
  // The attribute is written once, before hydration, and never changes — so
  // there is nothing to subscribe to.
  const resolved = useSyncExternalStore(
    noop,
    getTierSnapshot,
    getServerTierSnapshot,
  );
  const tier = value ?? resolved;

  // The scoped attribute exists only for a FORCED tier. The root provider must
  // not render it: <html data-motion-tier> is already set by the inline script,
  // and duplicating it here would both be redundant and produce a hydration
  // mismatch, since the server cannot know what the script will resolve.
  if (!value) {
    return (
      <MotionTierContext.Provider value={tier}>
        {children}
      </MotionTierContext.Provider>
    );
  }

  return (
    <MotionTierContext.Provider value={tier}>
      <div data-motion-tier={value} className="contents">
        {children}
      </div>
    </MotionTierContext.Provider>
  );
}
