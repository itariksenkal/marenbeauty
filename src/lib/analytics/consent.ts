'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  analytics,
  CONSENT_STORAGE_KEY,
  type ConsentState,
} from '@/config/analytics';

/**
 * The consent store.
 *
 * Live from launch even though nothing currently requires consent
 * (docs/OPEN-QUESTIONS.md C6): adding a gate after tracking has begun leaves a
 * window of data collected without it that cannot be fixed retroactively.
 *
 * THREE PROPERTIES THAT ARE NOT NEGOTIABLE:
 *
 *   - **Default denied.** `unset` is treated as `denied` by every consumer.
 *     There is no state in which a tag fires because nobody answered.
 *   - **Nothing is written until a visitor chooses.** A site with nothing to
 *     consent to stores nothing at all, which is what lets the cookie policy
 *     say so truthfully.
 *   - **Rejecting is exactly as easy as accepting** — one control each, same
 *     size, same prominence, no pre-ticked box, no "manage 47 partners".
 *
 * `useSyncExternalStore` rather than `useState` + an effect: the choice lives
 * outside React, in `localStorage`, and this is the API for exactly that. It
 * also gets the server snapshot right instead of correcting after hydration.
 */
const listeners = new Set<() => void>();

function read(): ConsentState {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unset';
  } catch {
    // Private mode, or storage disabled. Denied is the safe reading, and it is
    // also the honest one: we cannot record a choice, so we do not act on one.
    return 'unset';
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing the choice must move this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** The server has no storage, so it always renders the default: denied. */
const serverSnapshot = (): ConsentState => 'unset';

export function setConsent(state: Exclude<ConsentState, 'unset'>): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Nothing to do. The in-memory value below still drives this page view.
  }
  emit();
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // As above.
  }
  emit();
}

export function useConsent(): {
  readonly state: ConsentState;
  readonly granted: boolean;
  readonly grant: () => void;
  readonly deny: () => void;
  readonly reset: () => void;
} {
  const state = useSyncExternalStore(subscribe, read, serverSnapshot);

  const grant = useCallback(() => setConsent('granted'), []);
  const deny = useCallback(() => setConsent('denied'), []);
  const reset = useCallback(() => clearConsent(), []);

  return {
    state,
    // `unset` is denied. Consent Mode v2's default is denied for the same
    // reason: silence is not agreement.
    granted: state === 'granted' && analytics.consentGate.enabled,
    grant,
    deny,
    reset,
  };
}
