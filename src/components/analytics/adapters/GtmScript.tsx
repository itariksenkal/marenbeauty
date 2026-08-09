'use client';

import Script from 'next/script';

import { useConsent } from '@/lib/analytics/consent';

/**
 * Google Tag Manager, behind Consent Mode v2.
 *
 * ON since docs/OPEN-QUESTIONS.md C13 — advertising is starting, which is the
 * condition C6 was waiting for. It is the only tag this site loads, and it
 * loads for nobody who has not said yes.
 *
 * ── THREE THINGS MAKE THIS CORRECT RATHER THAN MERELY PRESENT ────────────────
 *
 *   1. **The element does not render at all until consent is granted.**
 *      `if (!granted) return null` is the outer layer, and it is the one a
 *      visitor can verify for themselves in the network panel. Consent Mode
 *      alone would still fetch `gtm.js` and send cookieless pings.
 *
 *   2. **The default is denied, and it is set BEFORE the loader runs.** Consent
 *      Mode's whole value is the ordering: a `consent default` written after
 *      the container has initialised is a banner with the door already open.
 *      Everything below is ONE script element for exactly that reason — order
 *      inside a single element is guaranteed by JavaScript execution, whereas
 *      order between an effect and an injected tag is a race that happens to
 *      work.
 *
 *   3. **There is no `<noscript>` iframe.** The canonical Google snippet ships
 *      one, and it is wrong here: it is markup, so it loads the container for a
 *      visitor with JavaScript disabled — who therefore has no banner, no way
 *      to consent, and no way to refuse. A gate a fallback walks around is not
 *      a gate. `MetaPixelScript` omits its pixel for the same reason, and a
 *      unit test holds both lines.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────────────────
 *
 * No GA4 tag and no Meta Pixel. With a container on the page they belong inside
 * it, configured in the GTM console, not as a second script element in this
 * repository. Their adapters stay unimported (`Analytics.tsx`).
 */
export function GtmScript({ containerId }: { containerId: string }) {
  const { granted } = useConsent();

  if (!granted) return null;

  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});
gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted',functionality_storage:'granted',personalization_storage:'granted'});
(function(w,d,s,l,i){w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${containerId}');`}
    </Script>
  );
}
