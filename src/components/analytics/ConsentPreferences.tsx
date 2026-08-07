'use client';

import { consentCopy, requiresConsentBanner } from '@/config/analytics';
import { useConsent } from '@/lib/analytics/consent';

/**
 * The always-available preferences panel, on `/cerez-politikasi`.
 *
 * This is the "re-openable" half of the consent requirement, and it is LIVE
 * today — unlike the banner, which correctly renders nothing while there is
 * nothing to consent to. A visitor who wants to know what this site stores can
 * come here at any time and be told, in a sentence, that the answer is nothing.
 *
 * Once a tag is enabled it becomes the place to change a decision, with the
 * same two controls the banner offers and a third to clear the choice entirely.
 */
export function ConsentPreferences() {
  const { state, grant, deny, reset } = useConsent();

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="font-display text-lg tracking-display text-text-primary">
        {consentCopy.preferencesHeading}
      </h2>

      {!requiresConsentBanner() ? (
        <p className="mt-3 text-sm text-text-secondary">
          {consentCopy.nothingToConsentTo}
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-text-secondary" role="status">
            {state === 'granted'
              ? consentCopy.statusGranted
              : state === 'denied'
                ? consentCopy.statusDenied
                : consentCopy.statusUnset}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={deny}
              className="duration-fast rounded-full border border-border-strong px-5 py-2 text-sm text-text-accent transition-colors hover:bg-surface-page focus-visible:focus-ring"
            >
              {consentCopy.reject}
            </button>
            <button
              type="button"
              onClick={grant}
              className="duration-fast rounded-full border border-border-strong px-5 py-2 text-sm text-text-accent transition-colors hover:bg-surface-page focus-visible:focus-ring"
            >
              {consentCopy.accept}
            </button>
            <button
              type="button"
              onClick={reset}
              className="duration-fast rounded-full px-5 py-2 text-sm text-text-muted underline decoration-1 underline-offset-4 transition-colors hover:text-text-accent focus-visible:focus-ring"
            >
              {consentCopy.change}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
