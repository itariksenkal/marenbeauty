import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { THEME_COLOR } from './manifest';
import { routeSeo, TITLE_SUFFIX } from '@/config/seo';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PreLaunchBand } from '@/components/layout/PreLaunchBand';
import { SkipLink } from '@/components/layout/SkipLink';
import { AuroraBackground } from '@/components/motion/AuroraBackground';
import { GrainOverlay } from '@/components/motion/GrainOverlay';
import { MotionTierProvider } from '@/components/motion/MotionTierProvider';
import { motionTierScript } from '@/components/motion/motion-tier-script';
import { mainContentId } from '@/config/navigation';
import { site } from '@/config/site';

import { fontVariables } from './fonts';
import '@/styles/globals.css';

/**
 * Root defaults — docs/SEO.md §1.
 *
 * `metadataBase` is the production origin, always: canonical URLs and OG image
 * URLs must point at production even from a preview deployment, or a preview
 * ends up telling a crawler it is the canonical site.
 *
 * `formatDetection.telephone: false` stops iOS auto-linking numbers in copy
 * into `tel:` links nobody authored — which would otherwise defeat the "never
 * emit an unintended tel:" rule (CLAUDE.md §7) in the one place the guard
 * cannot see, because the browser adds them after the HTML ships.
 *
 * No `hreflang`: the site is Turkish only and there is no alternate to declare.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: routeSeo.home.title,
    template: `%s${TITLE_SUFFIX}`,
  },
  description: routeSeo.home.description,
  applicationName: site.name,
  alternates: { canonical: site.url },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: site.name,
    url: site.url,
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      className={fontVariables}
      // The inline script below writes data-motion-tier before hydration, so
      // the client tree legitimately differs from the server tree here.
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        {/*
          Resolves the motion tier BEFORE first paint and writes it to
          <html data-motion-tier>. Synchronous and first in <body> on purpose:
          resolving after hydration would flash animated content before telling
          it not to animate — the same class of bug as the skip link rendering
          in flow before its stylesheet arrived.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: motionTierScript(process.env.NODE_ENV === 'development'),
          }}
        />
        <SkipLink />
        <MotionTierProvider>
          <AuroraBackground />
          <PreLaunchBand />
          <SiteHeader />
          <main id={mainContentId} tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </MotionTierProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
