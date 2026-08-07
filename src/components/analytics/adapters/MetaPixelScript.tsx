'use client';

import Script from 'next/script';

import { useConsent } from '@/lib/analytics/consent';

/**
 * Meta Pixel.
 *
 * OFF (docs/OPEN-QUESTIONS.md C6). Renders nothing at all without granted
 * consent — no script tag, no `<noscript>` tracking image.
 *
 * The `<noscript>` fallback the Meta setup snippet ships is DELIBERATELY
 * ABSENT. It is an image request that fires before any script can evaluate
 * consent, which makes a consent gate above it decorative. A visitor with
 * JavaScript disabled is simply not tracked, which is the correct outcome.
 */
export function MetaPixelScript({ pixelId }: { pixelId: string }) {
  const { granted } = useConsent();
  if (!granted) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  );
}
