'use client';

import Script from 'next/script';
import { useEffect } from 'react';

import { useConsent } from '@/lib/analytics/consent';

/**
 * Google Analytics 4, behind Consent Mode v2.
 *
 * OFF (docs/OPEN-QUESTIONS.md C6). Present so that switching it on is a config
 * change rather than a rushed integration the week advertising starts.
 *
 * TWO THINGS MAKE THIS CORRECT RATHER THAN MERELY PRESENT:
 *
 *   1. **The default is denied, and it is set BEFORE the tag loads.** Consent
 *      Mode's whole value is in the ordering: a `consent default` written after
 *      gtag.js has run is a consent banner with the door already open.
 *   2. **The script element does not render at all until consent is granted.**
 *      Consent Mode alone would still fetch gtag.js and send cookieless pings.
 *      Both layers, because the outer one is the one a visitor can verify.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function Ga4Script({ measurementId }: { measurementId: string }) {
  const { granted } = useConsent();

  useEffect(() => {
    window.dataLayer ??= [];
    const gtag = (...args: unknown[]) => window.dataLayer!.push(args);

    // Denied by default, always, on every page view — then updated only if the
    // visitor has actually chosen otherwise.
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
    });

    if (granted) {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
    }
  }, [granted]);

  if (!granted) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
    </>
  );
}
