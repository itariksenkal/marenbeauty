'use client';

import Link from 'next/link';

import { consentCopy, requiresConsentBanner } from '@/config/analytics';
import { useConsent } from '@/lib/analytics/consent';

/**
 * The consent banner.
 *
 * **Renders nothing today**, because `requiresConsentBanner()` is false: no tag
 * is enabled, so nothing on this site sets a cookie or calls a third party. A
 * banner asking permission for something that is not happening — on a site
 * whose cookie policy opens with "this site uses no cookies" — would make one
 * of the two a lie, and a visitor would be right to trust neither.
 *
 * The machinery is live regardless (docs/OPEN-QUESTIONS.md C6): the store, the
 * persisted choice, the preferences panel on `/cerez-politikasi`, and the rule
 * that every adapter reads consent before it loads. Flipping `ga4.enabled`
 * makes this appear with no other change.
 *
 * When it does appear:
 *   - **rejecting is exactly as easy as accepting** — two controls, same size,
 *     same weight, side by side, no pre-selection, no second screen;
 *   - it is a `role="dialog"` labelled by its own heading, not an `alert`;
 *   - it never blocks the page, and it never returns once answered.
 */
export function ConsentBanner() {
  const { state, grant, deny } = useConsent();

  if (!requiresConsentBanner()) return null;
  if (state !== 'unset') return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-heading"
      className="fixed inset-x-0 bottom-0 z-toast border-t border-border-subtle bg-surface-raised shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-gutter py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-lead">
          <p
            id="consent-heading"
            className="font-display text-lg tracking-display text-text-primary"
          >
            {consentCopy.bannerHeading}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {consentCopy.bannerBody}{' '}
            <Link
              href="/cerez-politikasi"
              className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
            >
              {consentCopy.policyLink}
            </Link>
          </p>
        </div>

        {/* Same element, same classes, same order of magnitude of effort. */}
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={deny}
            className="duration-fast rounded-full border border-border-strong px-6 py-3 text-sm text-text-accent transition-colors hover:bg-surface-page focus-visible:focus-ring"
          >
            {consentCopy.reject}
          </button>
          <button
            type="button"
            onClick={grant}
            className="duration-fast rounded-full border border-border-strong px-6 py-3 text-sm text-text-accent transition-colors hover:bg-surface-page focus-visible:focus-ring"
          >
            {consentCopy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
